import {
    getPatents,
    savePatents,
    getProjects,
    switchProject,
    createProject,
    deleteProject,
    getCurrentProject,
    getPatentLibrary
}
from "../storage/storage.js";

import {
    buildHistogramWithReferences,
    buildSubclassHistogramWithReferences,
    buildPrimaryUspcHistogramWithReferences,
    buildPrimaryUspcSubclassHistogramWithReferences,
    buildOtherUspcHistogramWithReferences,
    buildOtherUspcSubclassHistogramWithReferences,
    buildFamilyTotals,
    getClassificationFamily
}
from "./histogram.js";

import {
    renderPatentTable,
    renderHeaders,
    DEFAULT_COLUMNS,
    getReviewConceptColumnKey
}
from "./patentTable.js";

import {
    WORKFLOW_STAGES
}
from "./workflow.js";

import {
    exportData
}
from "../storage/exportImport.js";

let artUnits = {};
const artUnitCache = new Map();
let patents = [];
let selectedPatentIds =
    new Set();
let currentTablePatents = [];
let currentView = "references";
let currentPatentIndex =
    null;
let activeClassificationFilter =
    null;
let currentHistogram =
    {};
let compactClassTitle = true;
let compactSubclassTitle = true;
let compactPatentTitle = true;
let compactPatentAbstract = true;
let suppressArtUnitLookupDialog = false;
let artUnitLookupDialogOpen = false;

const STAGE_ONLY_PATENT_COLUMNS =
    [
        "universeReviewSelected",
        "overlap",
        "claims",
        "challengingClaimNumbers",
        "whyItMatters"
    ];

const PATENT_COMPARISON_STAGES =
    new Set(["universe","universeReview", "finalReferences"]);

const PATENT_REVIEW_SELECTION_STAGES =
    new Set([
        "universe"
    ]);

const PATENT_LIST_STAGES =
    new Set([
        "landscapeScan",
        "referenceList",
        "universe",
        "finalReferences"
    ]);

function shouldShowPatentComparisonColumns(
    stage
) {

    return PATENT_COMPARISON_STAGES.has(
        stage
    );
}

function getUniverseReviewConcepts(
    project
) {

    const concepts =
        project?.stages?.universeReview
            ?.concepts;

    return Array.isArray(
        concepts
    )
        ? concepts
        : [];
}

function getUniverseReviewConceptColumns(
    project
) {

    if (
        project?.workflow?.currentStage !==
        "universeReview"
    ) {

        return [];
    }

    return getUniverseReviewConcepts(
        project
    ).map(
        concept =>
            getReviewConceptColumnKey(
                concept.id
            )
    );
}

function escapeHtml(
    value
) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    ).replace(/"/g, "&quot;");
}

function getPatentColumnOrderForStage(
    columnOrder,
    stage,
    reviewConceptColumns = []
) {

    const visibleStageOnlyColumns =
        STAGE_ONLY_PATENT_COLUMNS.filter(
            column => {

                if (
                    column ===
                    "universeReviewSelected"
                ) {

                    return PATENT_REVIEW_SELECTION_STAGES
                        .has(stage);
                }

                if (
                    column ===
                    "claims"
                    ||
                    column ===
                    "challengingClaimNumbers"
                ) {

                    return stage ===
                        "universeReview";
                }

                return shouldShowPatentComparisonColumns(
                    stage
                );
            }
        );

    const baseColumns =
        columnOrder.filter(
            column =>
                isReviewConceptColumn(
                    column
                )
                    ? reviewConceptColumns
                        .includes(column)
                    : (
                        !STAGE_ONLY_PATENT_COLUMNS
                            .includes(column)
                        ||
                        visibleStageOnlyColumns
                            .includes(column)
                    )
        );

    const stageColumnOrder = [
        ...baseColumns,
        ...visibleStageOnlyColumns.filter(
            column =>
                !baseColumns.includes(
                    column
                )
        )
    ];

    if (
        reviewConceptColumns.length === 0
    ) {

        return stageColumnOrder;
    }

    const missingReviewConceptColumns =
        reviewConceptColumns.filter(
            column =>
                !stageColumnOrder.includes(
                    column
                )
        );

    if (
        missingReviewConceptColumns.length ===
        0
    ) {

        return stageColumnOrder;
    }

    const conceptInsertIndex =
        stageColumnOrder.includes(
            "whyItMatters"
        )
            ? stageColumnOrder.indexOf(
                "whyItMatters"
              )
            : stageColumnOrder.length;

    return [
        ...stageColumnOrder.slice(
            0,
            conceptInsertIndex
        ),
        ...missingReviewConceptColumns,
        ...stageColumnOrder.slice(
            conceptInsertIndex
        )
    ];
}

function isReviewConceptColumn(
    column
) {

    return String(column)
        .startsWith(
            "reviewConcept:"
        );
}

function getPatentSelectionId(
    patent
) {

    return String(
        patent.patentNumber ||
        patent.applicationNumber ||
        patent.referenceId ||
        ""
    );
}

function getSelectedPatents() {

    const sourcePatents =
        currentTablePatents.length
            ? currentTablePatents
            : patents;

    return sourcePatents.filter(
        patent =>
            selectedPatentIds.has(
                getPatentSelectionId(
                    patent
                )
            )
    );
}

function getProjectClassificationCodes(
    projectPatents
) {

    const codes =
        new Set();

    for (
        const patent
        of projectPatents
    ) {

        for (
            const code
            of [
                ...(patent.cpc || []),
                ...(patent.primaryCpc || []),
                ...(patent.uspc || [])
            ]
        ) {

            codes.add(
                code
            );
        }
    }

    return codes;
}

function showArtUnitLookupFailureDialog(
    missingArtUnits
) {

    if (
        suppressArtUnitLookupDialog
        ||
        artUnitLookupDialogOpen
    ) {

        return;
    }

    artUnitLookupDialogOpen =
        true;

    const overlay =
        document.createElement(
            "div"
        );

    overlay.className =
        "modalOverlay";

    const dialog =
        document.createElement(
            "div"
        );

    dialog.className =
        "artUnitLookupDialog";

    dialog.innerHTML = `
        <h3>
            Art Unit lookup failed
        </h3>

        <p>
            Art Unit lookup failed for ${missingArtUnits.length} USPC classification(s).
        </p>

        <pre>${missingArtUnits.join("\n")}</pre>

        <label>
            <input
                type="checkbox"
                id="suppressArtUnitLookupDialog"
            >
            Do not show again during this session
        </label>

        <div class="dialogActions">
            <button id="closeArtUnitLookupDialog">
                OK
            </button>
        </div>
    `;

    document.body.appendChild(
        overlay
    );

    document.body.appendChild(
        dialog
    );

    document
        .getElementById(
            "closeArtUnitLookupDialog"
        )
        .onclick =
        () => {

            suppressArtUnitLookupDialog =
                document
                    .getElementById(
                        "suppressArtUnitLookupDialog"
                    )
                    .checked;

            dialog.remove();
            overlay.remove();

            artUnitLookupDialogOpen =
                false;
        };
}

function areAllTablePatentsSelected() {

    return currentTablePatents.length > 0
        && currentTablePatents.every(
            patent =>
                selectedPatentIds.has(
                    getPatentSelectionId(
                        patent
                    )
                )
        );
}

function areSomeTablePatentsSelected() {

    return currentTablePatents.some(
        patent =>
            selectedPatentIds.has(
                getPatentSelectionId(
                    patent
                )
            )
    );
}

function areAllTablePatentsSelectedForReview() {

    return currentTablePatents.length > 0
        && currentTablePatents.every(
            patent =>
                patent.universeReviewSelected ===
                true
        );
}

function areSomeTablePatentsSelectedForReview() {

    return currentTablePatents.some(
        patent =>
            patent.universeReviewSelected ===
            true
    );
}

async function renderCurrentPatentTable(
    tablePatents = currentTablePatents
) {

    currentTablePatents =
        tablePatents;

    const columnOrder =
        await getColumnOrder();

    const project =
        await getCurrentProject();

    const renumberReferences =
        project?.workflow?.currentStage ===
        "universeReview";

    const reviewConcepts =
        getUniverseReviewConcepts(
            project
        );

    renderHeaders(
        columnOrder,
        {
            allSelected:
                areAllTablePatentsSelected(),

            allReviewSelected:
                areAllTablePatentsSelectedForReview(),

            someReviewSelected:
                areSomeTablePatentsSelectedForReview(),

            reviewConcepts
        }
    );

    renderPatentTable(
        currentTablePatents,
        columnOrder,
        {
            compactTitle:
                compactPatentTitle,

            compactAbstract:
                compactPatentAbstract,

            selectedPatentIds,

            referenceIdRenderer:
                renumberReferences
                    ? (
                        (
                            patent,
                            index
                        ) => index + 1
                      )
                    : (
                        patent =>
                            patent.referenceId
                      ),

            reviewConcepts
        }
    );

    setupEditButtons();
    setupPatentSelectionControls();
    setupPatentFieldControls();
    setupReviewConceptColumnControls();
}

function setupReviewConceptColumnControls() {

    document
        .querySelectorAll(
            ".patentReviewConceptHeader"
        )
        .forEach(
            header => {

                let pointerStart = null;

                header.onpointerdown =
                    event => {

                        pointerStart = {
                            x: event.clientX,
                            y: event.clientY
                        };
                    };

                header.onclick =
                    async event => {

                        if (
                            pointerStart
                            &&
                            (
                                Math.abs(
                                    event.clientX -
                                    pointerStart.x
                                ) > 4
                                ||
                                Math.abs(
                                    event.clientY -
                                    pointerStart.y
                                ) > 4
                            )
                        ) {

                            return;
                        }

                        const conceptId =
                            header.dataset
                                .conceptId;

                        const label =
                            header.textContent
                                .trim();

                        if (
                            !confirm(
                                `Delete concept column "${label}"?`
                            )
                        ) {

                            return;
                        }

                        await deleteReviewConcept(
                            conceptId
                        );
                    };
            }
        );
}

function setupPatentSelectionControls() {

    const selectAll =
        document.getElementById(
            "selectAllPatents"
        );

    if (selectAll) {

        selectAll.checked =
            areAllTablePatentsSelected();

        selectAll.indeterminate =
            !selectAll.checked
            && areSomeTablePatentsSelected();

        selectAll.onchange =
            async event => {

                for (
                    const patent
                    of currentTablePatents
                ) {

                    const id =
                        getPatentSelectionId(
                            patent
                        );

                    if (
                        event.target.checked
                    ) {

                        selectedPatentIds.add(
                            id
                        );
                    }

                    else {

                        selectedPatentIds.delete(
                            id
                        );
                    }
                }

                await renderCurrentPatentTable(
                    currentTablePatents
                );

                await updateCurrentHistogram();
            };
    }

    document
        .querySelectorAll(
            ".patentSelectionCheckbox"
        )
        .forEach(
            checkbox => {

                checkbox.onchange =
                    async event => {

                        const id =
                            event.target.dataset
                                .patentId;

                        if (
                            event.target.checked
                        ) {

                            selectedPatentIds.add(
                                id
                            );
                        }

                        else {

                            selectedPatentIds.delete(
                                id
                            );
                        }

                        await renderCurrentPatentTable(
                            currentTablePatents
                        );

                        await updateCurrentHistogram();
                    };
            }
        );
}

function setupPatentFieldControls() {

    const selectAllReview =
        document.getElementById(
            "selectAllReviewPatents"
        );

    if (selectAllReview) {

        selectAllReview.checked =
            areAllTablePatentsSelectedForReview();

        selectAllReview.indeterminate =
            !selectAllReview.checked
            && areSomeTablePatentsSelectedForReview();

        selectAllReview.onchange =
            async event => {

                for (
                    const patent
                    of currentTablePatents
                ) {

                    patent.universeReviewSelected =
                        event.target.checked;
                }

                await savePatents(
                    patents
                );

                await renderCurrentPatentTable(
                    currentTablePatents
                );
            };
    }

    document
        .querySelectorAll(
            ".patentFieldControl"
        )
        .forEach(
            control => {

                control.onchange =
                    async event => {

                        const field =
                            event.target.dataset
                                .field;

                        const patentId =
                            event.target.dataset
                                .patentId;

                        const conceptId =
                            event.target.dataset
                                .conceptId;

                        const patent =
                            patents.find(
                                candidate =>
                                    getPatentSelectionId(
                                        candidate
                                    ) === patentId
                            );

                        if (
                            !patent ||
                            ![
                                "relevance",
                                "overlap",
                                "whyItMatters",
                                "universeReviewSelected",
                                "claims",
                                "challengingClaimNumbers",
                                "conceptCoverage"
                            ].includes(field)
                        ) {

                            return;
                        }

                        if (
                            field ===
                            "conceptCoverage"
                        ) {

                            if (!conceptId) {

                                return;
                            }

                            patent.conceptCoverage ??= {};

                            patent.conceptCoverage[
                                conceptId
                            ] =
                                event.target.checked;
                        }

                        else {

                            patent[field] =
                                event.target.type ===
                                    "checkbox"
                                    ? event.target.checked
                                    : event.target.value;
                        }

                        await savePatents(
                            patents
                        );

                        if (
                            field ===
                            "universeReviewSelected"
                        ) {

                            await renderCurrentPatentTable(
                                currentTablePatents
                            );
                        }
                    };
            }
        );
}
    
const HISTOGRAM_COLUMNS_BY_STAGE = {

    landscapeScan: [

        "class",
        "count",
        "histogram",
        "references"
    ],

    referenceList: [

        "class",
        "classTitle",
        "subclassTitle",
        "count",
        "histogram",
        "references"
    ],

    classificationAnalysis: [

        "class",
        "classTitle",
        "subclassTitle",
        "count",
        "histogram",
        "references",
        "keep",
		"confidence",
		"researchTier",
		"reason"
    ],
    
    artUnit: [

		"class",
		"artUnit",
		"keep",
		"pickArtUnit",
		"classTitle",
		"subclassTitle",
		"count",
		"histogram",
		"references",
		"confidence",
		"researchTier",
		"artUnitReason",
		"reason"
	],
    
    examinerValidation: [
	
		"class",
		"artUnit",
		"employee",
		"phone",
		"comment",
		"classTitle",
		"subclassTitle",
		"count",
		"histogram",
		"references",
		"confidence",
		"researchTier",
		"reason"
	]
};

const RESEARCH_TIER_PRIORITY = {

    primary: 3,

    secondary: 2,

    tertiary: 1,

    none: 0
};

const HISTOGRAM_HEADER_MAP = {

    class:
        "Cls",
        
    artUnit:
		"Art Unit",

	pickArtUnit:
		"Pick",
		
	employee:
    "Employee",
	
	phone:
		"Phone",
		
		
	comment:
		"Comment",

    classTitle:
        "Class Title",

    subclassTitle:
        "Subclass Title",

    count:
        "#",

    histogram:
        "Histogram",

    references:
        "Refs",

    keep:
        "Keep",
        
    confidence: "Confidence",
	
	researchTier: "Tier",

	artUnitReason: "Art Unit Reason",

	reason: "Cls Reason"
};
    
const EDIT_FIELD_MAP = {

    patentNumber: {

        label: "Document Number",
        id: "editPatentNumber",
        type: "input"
    },

    title: {

        label: "Title",
        id: "editTitle",
        type: "input"
    },

    abstract: {

        label: "Abstract",
        id: "editAbstract",
        type: "textarea"
    },

    claims: {

        label: "Claims",
        id: "editClaims",
        type: "textarea"
    },

    challengingClaimNumbers: {

        label: "Challenge Claims",
        id: "editChallengingClaimNumbers",
        type: "textarea"
    },

    inventorName: {

        label: "Inventor Name",
        id: "editInventorName",
        type: "input"
    },

    assignee: {

        label: "Assignee",
        id: "editAssignee",
        type: "input"
    },

    applicationNumber: {

        label: "Application Number",
        id: "editApplicationNumber",
        type: "input",
        readonly: true
    },

    filingDate: {

        label: "Filing Date",
        id: "editFilingDate",
        type: "input",
        readonly: true
    },

    publicationDate: {

        label: "Publication Date",
        id: "editPublicationDate",
        type: "input",
        readonly: true
    },

    primaryClass: {

        label: "Primary Class",
        id: "editPrimaryClass",
        type: "input",
        readonly: true
    },

    otherClasses: {

        label: "Other Classes",
        id: "editOtherClasses",
        type: "textarea",
        readonly: true
    },

    relevance: {

        label: "Relevance",
        id: "editRelevance",
        type: "select",
        options: ["None","strong","partial", "weak"]
    },

    overlap: {

        label: "Overlap",
        id: "editOverlap",
        type: "select",
        options: ["None", "Low","Medium","High","Very High"]
    },

    whyItMatters: {

        label: "Why it matters",
        id: "editWhyItMatters",
        type: "textarea"
    },
    
    url: {
	
		label: "URL",
		id: "editUrl",
		type: "input",
		readonly: true
	},
	
	cpc: {
	
		label: "CPC",
		id: "editCpc",
		type: "textarea",
		readonly: true
	},
	
	uspc: {
	
		label: "USPC",
		id: "editUspc",
		type: "textarea",
		readonly: true
	}
};

async function renderCurrentStage() {

    const project =
        await getCurrentProject();

    const container =
        document.getElementById(
            "workflowContent"
        );
        
    const referencesTab =
		document.getElementById(
			"referencesTab"
		);
	
	const cpcTab =
		document.getElementById(
			"cpcTab"
		);
		
	const classificationTab =
		document.getElementById(
			"classificationTab"
		);
	
	const primaryUspcTab =
		document.getElementById(
			"primaryUspcTab"
		);
	
	const otherUspcTab =
		document.getElementById(
			"allUspcTab"
		);
		
	referencesTab.style.display = "";
	
	cpcTab.style.display = "";
	
	primaryUspcTab.style.display = "";
	
	otherUspcTab.style.display = "";
	
	classificationTab.style.display = "none";

    switch (
        project.workflow
            ?.currentStage
    ) {

        case "landscapeScan":
        
        	currentView = "cpc";

            container.innerHTML = "";

            break;

        case "referenceList":
        
        	currentView = "cpc";

            container.innerHTML = "";

            break;
            
        case "classificationAnalysis":
		
			currentView =
				"cpc";
		
			container.innerHTML = "";
		
			break;
            
        case "artUnit":
		case "examinerValidation":
		
			container.innerHTML = "";
		
			cpcTab.style.display = "none";
		
			primaryUspcTab.style.display = "none";
		
			otherUspcTab.style.display = "none";
		
			classificationTab.style.display = "";
		
			currentView = "classification";
		
			break;

        case "universe":

            currentView = "cpc";
            
            container.innerHTML = `

                <p>
                    Coming Soon
                </p>
            `;

            break;

        case "universeReview":

            currentView = "cpc";

            const reviewConcepts =
                getUniverseReviewConcepts(
                    project
                );

            container.innerHTML = `

                <div class="reviewConceptEditor">
                    <div class="reviewConceptHeader">
                        Review Concepts
                    </div>

                    <div class="reviewConceptAddRow">
                        <input
                            id="newReviewConcept"
                            class="reviewConceptInput"
                        >

                        <button id="addReviewConcept">
                            Add Column
                        </button>
                    </div>
                </div>
            `;

            document
                .getElementById(
                    "addReviewConcept"
                )
                .onclick =
                addReviewConcept;

            break;

        default:

            currentView = "cpc";
            container.innerHTML = "";
    }
}

async function updateUniverseReviewConcepts(
    updater
) {

    const result =
        await chrome.storage.local.get([
            "projects",
            "currentProjectId"
        ]);

    const projects =
        result.projects || [];

    const project =
        projects.find(
            candidate =>
                candidate.id ===
                result.currentProjectId
        );

    if (!project) {

        return;
    }

    project.stages ??= {};
    project.stages.universeReview ??= {
        excludedPatentIds: [],
        notes: "",
        concepts: []
    };

    project.stages.universeReview.concepts =
        updater(
            getUniverseReviewConcepts(
                project
            )
        );

    await chrome.storage.local.set({
        projects
    });

    await refreshUniverseReviewConceptColumns();
}

async function refreshUniverseReviewConceptColumns() {

    await renderCurrentStage();

    await renderCurrentPatentTable(
        await getPatentsForCurrentStage()
    );

    await renderEditFields();

    enableColumnDragDrop();
}

async function addReviewConcept() {

    const input =
        document.getElementById(
            "newReviewConcept"
        );

    const label =
        input.value.trim();

    if (!label) {

        return;
    }

    await updateUniverseReviewConcepts(
        concepts => {

            if (
                concepts.some(
                    concept =>
                        concept.label ===
                        label
                )
            ) {

                return concepts;
            }

            return [
                ...concepts,
                {
                    id:
                        crypto.randomUUID(),
                    label
                }
            ];
        }
    );
}

async function deleteReviewConcept(
    conceptId
) {

    if (!conceptId) {

        return;
    }

    await updateUniverseReviewConcepts(
        concepts =>
            concepts.filter(
                concept =>
                    concept.id !==
                    conceptId
            )
    );
}

async function getPatentsForCurrentStage() {

    const project =
        await getCurrentProject();

    const stageId =
        project?.workflow?.currentStage;

    if (
        PATENT_LIST_STAGES.has(
            stageId
        )
        && Array.isArray(
            project?.stages?.[
                stageId
            ]
        )
        && project.stages[
            stageId
        ].length > 0
    ) {

        const patentLibrary =
            await getPatentLibrary();

        return project.stages[
            stageId
        ]
            .map(
                patentNumber =>
                    patentLibrary[
                        patentNumber
                    ]
            )
            .filter(Boolean);
    }

    if (
        stageId ===
        "universeReview"
    ) {

        return patents.filter(
            patent =>
                patent.universeReviewSelected !==
                false
        );
    }

    return patents;
}

async function saveCurrentStage(
    stageId
) {

    const result =
        await chrome.storage.local.get([
            "projects",
            "currentProjectId"
        ]);

    const project =
        result.projects.find(
            p =>
                p.id ===
                result.currentProjectId
        );

    if (!project) {

        return;
    }

    project.workflow ??= {};

    project.workflow.currentStage =
        stageId;

    await chrome.storage.local.set({

        projects:
            result.projects
    });
}

async function renderWorkflowSelector() {

    const project =
        await getCurrentProject();

    const selector =
        document.getElementById(
            "workflowSelector"
        );

    selector.innerHTML = "";

    for (
        const stage
        of WORKFLOW_STAGES
    ) {

        selector.innerHTML += `

            <option
                value="${stage.id}"
            >
                ${stage.title}
            </option>
        `;
    }

    selector.value =
        project.workflow
            ?.currentStage
        ||
        "landscapeScan";
        
    const stage =
		WORKFLOW_STAGES.find(
			stage =>
				stage.id ===
				selector.value
		);
	
	document.getElementById(
		"workflowDescription"
	).textContent =
		stage?.reason || "";
}

async function filterByClassification(
    code,
    references
) {

    activeClassificationFilter =
        code;

    const stagePatents =
        await getPatentsForCurrentStage();

    const filteredPatents =
		stagePatents
			.filter(
				patent =>
					references.includes(
						patent.referenceId
					)
			)
			.map(
				patent => ({
					...patent,
					originalIndex:
						patents.indexOf(
							patent
						)
				})
			);

    await renderCurrentPatentTable(
        filteredPatents
    );
}

async function clearClassificationFilter() {

    activeClassificationFilter =
        null;

    const stagePatents =
        await getPatentsForCurrentStage();

    await renderCurrentPatentTable(
        stagePatents
    );

    setupEditButtons();
}

async function getColumnOrder() {

    const result =
        await chrome.storage.local.get(
            "columnOrder"
        );

    const project =
        await getCurrentProject();

    return getPatentColumnOrderForStage(
        result.columnOrder ||
        DEFAULT_COLUMNS,
        project?.workflow?.currentStage,
        getUniverseReviewConceptColumns(
            project
        )
    );
}

async function saveColumnOrder(
    order
) {

    const result =
        await chrome.storage.local.get(
            "columnOrder"
        );

    const project =
        await getCurrentProject();

    const reviewConceptColumns =
        getUniverseReviewConceptColumns(
            project
        );

    const existingOrder =
        normalizeColumnOrder(
            result.columnOrder ||
            DEFAULT_COLUMNS,
            reviewConceptColumns
        );

    const visibleOrder =
        normalizeVisibleColumnOrder(
            order,
            reviewConceptColumns
        );

    const visibleColumns =
        new Set(
            visibleOrder
        );

    const mergedOrder = [];
    let visibleIndex = 0;

    for (
        const column
        of existingOrder
    ) {

        if (
            visibleColumns.has(
                column
            )
        ) {

            if (
                visibleIndex <
                visibleOrder.length
            ) {

                mergedOrder.push(
                    visibleOrder[
                        visibleIndex
                    ]
                );

                visibleIndex++;
            }
        }

        else {

            mergedOrder.push(
                column
            );
        }
    }

    for (
        ;
        visibleIndex <
        visibleOrder.length;
        visibleIndex++
    ) {

        mergedOrder.push(
            visibleOrder[
                visibleIndex
            ]
        );
    }

    await chrome.storage.local.set({

        columnOrder:
            normalizeColumnOrder(
                mergedOrder,
                reviewConceptColumns
            )
    });
}

function normalizeColumnOrder(
    order,
    reviewConceptColumns = []
) {

    const columns = [];
    const validColumns =
        [
            ...DEFAULT_COLUMNS,
            ...reviewConceptColumns
        ];

    for (
        const column
        of order
    ) {

        if (
            validColumns.includes(
                column
            )
            &&
            !columns.includes(
                column
            )
        ) {

            columns.push(
                column
            );
        }
    }

    for (
        const column
        of validColumns
    ) {

        if (
            !columns.includes(
                column
            )
        ) {

            columns.push(
                column
            );
        }
    }

    return columns;
}

function normalizeVisibleColumnOrder(
    order,
    reviewConceptColumns = []
) {

    const columns = [];
    const validColumns =
        [
            ...DEFAULT_COLUMNS,
            ...reviewConceptColumns
        ];

    for (
        const column
        of order
    ) {

        if (
            validColumns.includes(
                column
            )
            &&
            !columns.includes(
                column
            )
        ) {

            columns.push(
                column
            );
        }
    }

    return columns;
}

async function getHistogramColumnOrder() {

    const result =
        await chrome.storage.local.get(
            "histogramColumnOrder"
        );

    return (
        result.histogramColumnOrder
        ||
        DEFAULT_HISTOGRAM_COLUMNS
    );
}

async function saveHistogramColumnOrder(
    order
) {

    await chrome.storage.local.set({

        histogramColumnOrder:
            order
    });
}

function buildExportFilename(
    project,
    stageId
) {

    const name =
        project?.name
        || "patent-universe";

    const stage =
        WORKFLOW_STAGES.find(
            candidate =>
                candidate.id ===
                stageId
        );

    const exportName =
        stage
            ? `${name} - ${stage.title}`
            : name;

    const safeName =
        exportName
            .trim()
            .replace(
                /[\\/:*?"<>|]+/g,
                "-"
            )
            .replace(
                /\s+/g,
                " "
            )
            || "patent-universe";

    return safeName.endsWith(
        ".json"
    )
        ? safeName
        : `${safeName}.json`;
}


function enableColumnDragDrop() {

    const headers =
        document.querySelectorAll(
            "#headerRow th[data-column]"
        );

    let draggedHeader =
        null;

    headers.forEach(
        header => {

            header.addEventListener(
                "dragstart",
                () => {

                    draggedHeader =
                        header;
                }
            );

            header.addEventListener(
                "dragover",
                e => {

                    e.preventDefault();
                }
            );

            header.addEventListener(
                "drop",
                async () => {

                    if (
                        draggedHeader ===
                        header
                    ) {

                        return;
                    }

                    const order =
                        await getColumnOrder();

                    const from =
                        order.indexOf(
                            draggedHeader.dataset.column
                        );

                    const to =
                        order.indexOf(
                            header.dataset.column
                        );

                    const moved =
                        order.splice(
                            from,
                            1
                        )[0];

                    order.splice(
                        to,
                        0,
                        moved
                    );

                    await saveColumnOrder(
                        order
                    );

                    await renderCurrentPatentTable(
                        currentTablePatents
                    );
                    
                    await renderEditFields();

                    enableColumnDragDrop();
                }
            );
        }
    );
}

function enableHistogramDragDrop() {

    const headers =
        document.querySelectorAll(
            "#histogramHeaderRow th"
        );

    let dragged =
        null;

    headers.forEach(
        header => {

            header.addEventListener(
                "dragstart",
                () => {

                    dragged =
                        header;
                }
            );

            header.addEventListener(
                "dragover",
                e => {

                    e.preventDefault();
                }
            );

            header.addEventListener(
                "drop",
                async () => {

                    if (
                        dragged ===
                        header
                    ) {

                        return;
                    }

                    const order =
                        await getHistogramColumnOrder();

                    const from =
                        order.indexOf(
                            dragged.dataset.column
                        );

                    const to =
                        order.indexOf(
                            header.dataset.column
                        );

                    const moved =
                        order.splice(
                            from,
                            1
                        )[0];

                    order.splice(
                        to,
                        0,
                        moved
                    );

                    await saveHistogramColumnOrder(
                        order
                    );

                    await renderHistogram(
                        currentHistogram,
                        document
                            .querySelector(
                                "#histogramOutput h3"
                            )
                            .textContent
                    );
                }
            );
        }
    );
}

async function init() {

    await loadArtUnits();
    
    await renderProjectSelector();
    
    await renderWorkflowSelector();
	
	await renderCurrentStage();
    
    patents =
        await getPatents();
        
    patents.forEach(
		(
			patent,
			index
		) => {
	
			patent.referenceId =
				index + 1;
		}
	);

    selectedPatentIds =
        new Set(
            patents.map(
                getPatentSelectionId
            )
        );

	await renderCurrentPatentTable(
        await getPatentsForCurrentStage()
    );
	
	await renderEditFields();
    
    enableColumnDragDrop();
	setupEditDialog();
	
	document
		.getElementById(
			"compactPatentTitle"
		)
		.onchange =
		async event => {
	
			compactPatentTitle =
				event.target.checked;
				
			await renderCurrentPatentTable(
                currentTablePatents
            );
		};
		
	document
		.getElementById(
			"copyPatentTable"
		)
		.onclick =
		async () => {
	
			const table =
				document.getElementById(
					"patentTable"
				);
				
			const columnOrder =
				await getColumnOrder();
	
			const rows = [];
	
			for (
				const row
				of table.rows
			) {
	
				const values = [];
				
				const editButton =
					row.querySelector(
						".editPatent"
					);
					
				const patent =
					editButton
						? patents[
							Number(
								editButton.dataset.index
							)
						  ]
						: null;
	
				for (
					let cellIndex = 0;
					cellIndex < row.cells.length;
					cellIndex++
				) {
				
					const cell =
						row.cells[
							cellIndex
						];
						
					const column =
						columnOrder[
							cellIndex - 1
						];
						
					let value =
						cell.innerText;
						
				if (
					patent
					&&
					cellIndex === 0
				) {
				
					value =
						cell.dataset
                            .referenceId ||
						patent.referenceId;
				}
					
					if (
						patent
						&&
						column === "title"
					) {
					
						value =
							patent.title || "";
					}
					
					if (
						patent
						&&
						column === "abstract"
					) {
					
						value =
							patent.abstract || "";
					}
	
					values.push(
	
						String(
							value ?? ""
						)
							.replace(
								/\s+/g,
								" "
							)
							.trim()
					);
				}
	
				rows.push(
					values.join("\t")
				);
			}
	
			await navigator.clipboard.writeText(
	
				rows.join("\n")
			);
	
			alert(
				"Patent table copied."
			);
		};
	
	document
		.getElementById(
			"compactPatentAbstract"
		)
		.onchange =
		async event => {
	
			compactPatentAbstract =
				event.target.checked;
				
			await renderCurrentPatentTable(
                currentTablePatents
            );
		};
	
	document
    .getElementById(
        "workflowSelector"
    )
    .onchange =
    async e => {

        await saveCurrentStage(
            e.target.value
        );
        
        const stage =
			WORKFLOW_STAGES.find(
				stage =>
					stage.id ===
					e.target.value
			);
		
        document.getElementById(
			"workflowDescription"
		).textContent =
			stage?.reason || "";

        await renderCurrentStage();
        await renderCurrentPatentTable(
            await getPatentsForCurrentStage()
        );
        await renderEditFields();
        enableColumnDragDrop();
        
        if (
            currentView === "cpc"
        ) {

            await renderCpcHistogram();
        }

        else if (
			currentView === "primaryUspc"
		) {
		
			await renderPrimaryUspcHistogram();
		}
		
		else if (
			currentView === "allUspc"
		) {
		
			await renderOtherUspcHistogram();
		}
		else if (
			currentView === "classification"
		) {
		
			await renderClassificationHistogram();
		}
    };
	
	document
		.getElementById(
			"projectSelector"
		)
		.onchange =
		async e => {
	
			await switchProject(
				e.target.value
			);
	
			location.reload();
		};
		
	document
		.getElementById(
			"newProject"
		)
		.onclick =
		async () => {
	
			const name =
				prompt(
					"Project name"
				);
	
			if (!name) {
	
				return;
			}
	
			await createProject(
				name
			);
	
			location.reload();
		};
		
	document
		.getElementById(
			"deleteProject"
		)
		.onclick =
		async () => {
	
			if (
				!confirm(
					"Delete project?"
				)
			) {
	
				return;
			}
	
			const result =
				await chrome.storage.local.get(
					"currentProjectId"
				);
	
			await deleteProject(
				result.currentProjectId
			);
	
			location.reload();
		};

	document
		.getElementById(
			"exportData"
		)
		.onclick =
		async () => {

			const project =
				await getCurrentProject();

			const stageId =
				project?.workflow?.currentStage ||
				"landscapeScan";

			const filename =
				buildExportFilename(
					project,
					stageId
				);

			const stagePatents =
				await getPatentsForCurrentStage();

			await exportData(
				filename,
				stagePatents,
                getUniverseReviewConcepts(
                    project
                )
			);
		};

    document
		.getElementById(
			"cpcTab"
		)
		.onclick =
		async () => {
		
			currentView =
				"cpc";
		
			await renderCpcHistogram();
		};

    document
		.getElementById(
			"primaryUspcTab"
		)
		.onclick =
		async () => {
	
			currentView =
				"primaryUspc";
	
			await renderPrimaryUspcHistogram();
		};
	
	document
		.getElementById(
			"allUspcTab"
		)
		.onclick =
		async () => {
	
			currentView =
				"allUspc";
	
			await renderOtherUspcHistogram();
		};
		
	document
		.getElementById(
			"classificationTab"
		)
		.onclick =
		async () => {
	
			currentView =
				"classification";
	
			await renderClassificationHistogram();
		};

    document
		.getElementById(
			"referencesTab"
		)
		.onclick =
		() => {
	
			currentView =
				"references";
	
			showReferences();
			currentView = "references";
		};
		
	document
		.getElementById(
			"showFullClasses"
		)
		.addEventListener(
			"change",
			updateCurrentHistogram
		);
		
	document
		.getElementById(
			"clearClassificationFilter"
		)
		.onclick =
		clearClassificationFilter;
}


async function loadArtUnits() {

    artUnits =
        await fetch(
            chrome.runtime.getURL(
                "tool/output/artUnits.json"
            )
        ).then(
            response => response.json()
        );

}


function subclassMatchesRange(
    subclass,
    range
) {

    if (
        range.from === "ALL"
    ) {

        return true;
    }

    //
    // FOR
    //

    if (
        subclass.startsWith(
            "FOR "
        )
    ) {

        if (
            range.to === ""
        ) {

            return (
                subclass ===
                range.from
            );
        }

        return (
            subclass >= range.from
            &&
            subclass <= range.to
        );
    }

    //
    // DIG
    //

    if (
        subclass.startsWith(
            "DIG "
        )
    ) {

        if (
            range.to === ""
        ) {

            return (
                subclass ===
                range.from
            );
        }

        return (
            subclass >= range.from
            &&
            subclass <= range.to
        );
    }

    //
    // E subclasses
    //

    if (
        subclass.startsWith(
            "E"
        )
    ) {

        if (
            range.to === ""
        ) {

            return (
                subclass ===
                range.from
            );
        }

        return (
            subclass >= range.from
            &&
            subclass <= range.to
        );
    }

    const value =
        Number(
            subclass
        );

    const from =
        Number(
            range.from
        );

    const to =
        range.to === ""
            ? from
            : Number(
                range.to
            );

    return (
        value >= from
        &&
        value <= to
    );

}



function lookupArtUnit(
    uspc
) {

    if (
        artUnitCache.has(
            uspc
        )
    ) {

        return artUnitCache.get(
            uspc
        );
    }

    if (
        !uspc.includes("/")
    ) {

        return "";
    }

    const [
        classNumber,
        subclass
    ] =
        uspc.split("/");

    const classInfo =
        artUnits[
            classNumber
        ];

    if (
        !classInfo
    ) {

        return "";
    }

    for (
        const range
        of classInfo.ranges
    ) {

        if (
            subclassMatchesRange(
                subclass,
                range
            )
        ) {

            artUnitCache.set(
                uspc,
                range.artUnit
            );

            return range.artUnit;
        }
    }

    console.info(
		`No Art Unit found for USPC ${uspc}`
	);
	
	artUnitCache.set(
		uspc,
		"Not Found"
	);
	
	return "Not Found";

}


async function renderProjectSelector() {

    const result =
        await chrome.storage.local.get([
            "projects",
            "currentProjectId"
        ]);

    const selector =
        document.getElementById(
            "projectSelector"
        );

    selector.innerHTML = "";

    for (
        const project
        of result.projects
    ) {

        selector.innerHTML += `

            <option
                value="${project.id}"
            >
                ${project.name}
            </option>
        `;
    }

    selector.value =
        result.currentProjectId;
}

async function updateCurrentHistogram() {

    if (
        currentView ===
        "cpc"
    ) {

        await renderCpcHistogram();
    }

    else if (
		currentView === "primaryUspc"
	) {
	
		await renderPrimaryUspcHistogram();
	}
	
	else if (
		currentView === "allUspc"
	) {
	
		await renderOtherUspcHistogram();
	}
	else if (
		currentView ===
		"classification"
	) {
	
		await renderClassificationHistogram();
	}
}

function showReferences() {

    document
        .getElementById(
            "histogramOutput"
        )
        .textContent = "";
}

async function renderCpcHistogram() {

    const histogramPatents =
        getSelectedPatents();

    const showFull =
        document
            .getElementById(
                "showFullClasses"
            )
            .checked;

    const histogram =
		showFull
			? buildHistogramWithReferences(
				histogramPatents,
				"allCpc"
			)
			: buildSubclassHistogramWithReferences(
				histogramPatents,
				"cpc"
			);

    await renderHistogram(
        histogram,
        showFull
            ? "Top CPC Subclasses"
            : "Top CPC Classes"
    );
}

async function renderPrimaryUspcHistogram() {

    const histogramPatents =
        getSelectedPatents();

    const showFull =
        document
            .getElementById(
                "showFullClasses"
            )
            .checked;

    const histogram =
        showFull

            ? buildPrimaryUspcHistogramWithReferences(
                histogramPatents
              )

            : buildPrimaryUspcSubclassHistogramWithReferences(
                histogramPatents
              );

    await renderHistogram(

        histogram,

        showFull

            ? "Top Primary USPC Classes"

            : "Top Primary USPC Main Classes"
    );
}

async function renderOtherUspcHistogram() {

    const histogramPatents =
        getSelectedPatents();

    const showFull =
        document
            .getElementById(
                "showFullClasses"
            )
            .checked;

    const histogram =
        showFull
				? buildOtherUspcHistogramWithReferences(
					histogramPatents
				  )
				: buildOtherUspcSubclassHistogramWithReferences(
					histogramPatents
				  );

    await renderHistogram(

        histogram,

        showFull

            ? "Top Other USPC Classes"

            : "Top Other USPC Main Classes"
    );
}

async function renderClassificationHistogram() {

    const histogramPatents =
        getSelectedPatents();

    const showFull =
        document
            .getElementById(
                "showFullClasses"
            )
            .checked;

    const histogram = {};

    const mergeHistogram =
        source => {

            for (
                const [
                    code,
                    data
                ]
                of Object.entries(
                    source
                )
            ) {

                histogram[code] ??= {

                    count: 0,

                    references: []
                };

                histogram[
                    code
                ].count +=
                    data.count;

                for (
                    const ref
                    of data.references
                ) {

                    if (
                        !histogram[
                            code
                        ].references.includes(
                            ref
                        )
                    ) {

                        histogram[
                            code
                        ].references.push(
                            ref
                        );
                    }
                }
            }
        };

    mergeHistogram(

        showFull

            ? buildHistogramWithReferences(
                histogramPatents,
                "allCpc"
            )

            : buildSubclassHistogramWithReferences(
                histogramPatents,
                "cpc"
            )
    );

    mergeHistogram(

        showFull

            ? buildPrimaryUspcHistogramWithReferences(
                histogramPatents
            )

            : buildPrimaryUspcSubclassHistogramWithReferences(
                histogramPatents
            )
    );

    mergeHistogram(

        showFull

            ? buildOtherUspcHistogramWithReferences(
                histogramPatents
            )

            : buildOtherUspcSubclassHistogramWithReferences(
                histogramPatents
            )
    );
	
	await renderHistogram(
	
		histogram,
	
		"Selected Classifications"
	);

}

function isParentClassification(
    code
) {

    return !code.includes(
        "/"
    );
}

function getParentClassification(
    code
) {

    if (
        /^[A-HY]/.test(
            code
        )
    ) {

        return code.match(
            /^([A-HY]\d{2}[A-Z]\d+)/
        )[1];
    }

    return code.split(
        "/"
    )[0];
}

function synchronizeParentClassification(
    editedCode,
    classifications
) {

    if (
        isParentClassification(
            editedCode
        )
    ) {

        return;
    }

    const parentCode =
        getParentClassification(
            editedCode
        );

    const keptChildren =
        Object.entries(
            classifications
        )
        .filter(

            ([code, record]) =>

                !isParentClassification(
                    code
                )

                &&

                getParentClassification(
                    code
                ) === parentCode

                &&

                record.keep
        );

    const parent =
        classifications[
            parentCode
        ];

    if (
        !parent
    ) {

        return;
    }

    if (
        keptChildren.length === 0
    ) {

        parent.keep =
            false;

        parent.confidence =
            "None";

        parent.researchTier =
            "None";

        parent.reason =
            "";

        return;
    }

    keptChildren.sort(

        (
            [, a],
            [, b]
        ) =>

            RESEARCH_TIER_PRIORITY[
                b.researchTier?.toLowerCase()
                || "none"
            ]

            -

            RESEARCH_TIER_PRIORITY[
                a.researchTier?.toLowerCase()
                || "none"
            ]
    );

    const winner =
        keptChildren[0][1];

    parent.keep =
        winner.keep;

    parent.confidence =
        winner.confidence;

    parent.researchTier =
        winner.researchTier;

    parent.reason =
        winner.reason;
}

async function normalizeClassificationAnalysisDefaults(
    classifications
) {

    let changed =
        false;

    for (
        const record
        of Object.values(
            classifications
        )
    ) {

        if (
            !record.keep
            &&
            record.confidence === "Medium"
        ) {

            record.confidence =
                "None";

            changed =
                true;
        }

        if (
            record.researchTier === "none"
        ) {

            record.researchTier =
                "None";

            changed =
                true;
        }
    }

    if (
        changed
    ) {

        await chrome.storage.local.set({
            classifications
        });
    }
}
    
async function renderHistogram(
    histogram,
    title
) {
	currentHistogram =
    histogram;
    
    const missingArtUnits = [];
    
    const project =
		await getCurrentProject();
	
	const stage =
		project.workflow
			?.currentStage;
			
	const showFullClasses =
		document
			.getElementById(
				"showFullClasses"
			)
			?.checked;
			
	const storage =
		await chrome.storage.local.get(
			"classifications"
		);
    
	const classifications =
		storage.classifications || {};

    if (
        stage === "classificationAnalysis"
    ) {

        await normalizeClassificationAnalysisDefaults(
            classifications
        );
    }
		
	if (
		stage === "examinerValidation"
		||
		stage === "artUnit"
	) {
	
		histogram =
			Object.fromEntries(
	
				Object.entries(
					histogram
				).filter(
	
					([code]) => {
				
					const record =
						classifications[
							code
						];

					if (
						stage === "examinerValidation"
					) {

						if (
							record?.pickArtUnit
						) {

							return true;
						}

						return Object.entries(
							classifications
						).some(

							([symbol, child]) =>

								child.pickArtUnit &&
								symbol.startsWith(
									code + "/"
								)
						);
					}
				
					if (
						record?.keep
					) {
				
						return true;
					}
				
					return Object.entries(
						classifications
					).some(
				
						([symbol, child]) =>
				
							child.keep &&
							symbol.startsWith(
								code + "/"
							)
					);
				}
				)
			);
	}
    
    const container =
			document.getElementById(
				"histogramOutput"
			);

    const familyTotals =
    buildFamilyTotals(
        histogram
    );
    
    const sorted =
    Object.entries(
        histogram
    )
		.sort(
		(
			[codeA, dataA],
			[codeB, dataB]
		) => {
	
			const familyA =
				getClassificationFamily(
					codeA
				);
	
			const familyB =
				getClassificationFamily(
					codeB
				);
	
			const familyTotalA =
				familyTotals[
					familyA
				];
	
			const familyTotalB =
				familyTotals[
					familyB
				];
	
			if (
				familyTotalA !==
				familyTotalB
			) {
	
				return (
					familyTotalB -
					familyTotalA
				);
			}
	
			if (
				familyA !==
				familyB
			) {
	
				return familyA
					.localeCompare(
						familyB
					);
			}
	
			if (
				dataA.count !==
				dataB.count
			) {
	
				return (
					dataB.count -
					dataA.count
				);
			}
	
			return codeA
				.localeCompare(
					codeB
				);
		}
	);
	
	container.innerHTML = `
	
		<div>
		
			<h3>${title}</h3>
		
			<label>
		
				<input
					type="checkbox"
					id="compactClassTitle"
					${
						compactClassTitle
							? "checked"
							: ""
					}
				>
		
				Class Title
		
			</label>
		
			${
				!(
					(
						stage === "examinerValidation"
						||
						stage === "artUnit"
					)
					&&
					!showFullClasses
				)
					? `
						<label class="controlSpacing">
			
							<input
								type="checkbox"
								id="compactSubclassTitle"
								${
									compactSubclassTitle
										? "checked"
										: ""
								}
							>
			
							Subclass Title
			
						</label>
					`
					: ""
			}
		
			<button
				id="copyHistogram"
			>
				Copy
			</button>
		
		</div>
	
		<table
			id="histogramTable"
		>
	
			<thead>
	
				<tr
					id="histogramHeaderRow"
				>
				</tr>
	
			</thead>
	
			<tbody
				id="histogramTableBody"
			>
			</tbody>
	
		</table>
	`;

	
	let histogramColumnOrder =
		[
			...(
				HISTOGRAM_COLUMNS_BY_STAGE[
					stage
				]
				??
				await getHistogramColumnOrder()
			)
		];
	
	if (
		(
			stage === "examinerValidation"
			||
			stage === "artUnit"
		)
		&&
		!showFullClasses
	) {
	
		histogramColumnOrder =
			histogramColumnOrder.filter(
				column =>
					column !==
					"subclassTitle"
			);
	}
	
	const headerRow =
		document.getElementById(
			"histogramHeaderRow"
		);
	
	headerRow.innerHTML =
		histogramColumnOrder
			.map(
				column => `
					<th
						draggable="true"
						data-column="${column}"
					>
						${
							HISTOGRAM_HEADER_MAP[
								column
							]
						}
					</th>
				`
			)
			.join("");
	
	const tableBody =
		document.getElementById(
			"histogramTableBody"
		);
	
	const maxCount =
		Math.max(
			...sorted.map(
				([, data]) =>
					data.count
			)
		);

    let classificationStorageChanged =
        false;
		
	for (
		const [
			code,
			data
		]
		of sorted
	) {
	
		const refs =
			data.references
				.sort(
					(a,b) =>
						a - b
				)
				.join(",");

        const shouldLookupArtUnit =
            stage === "artUnit";

		const computedArtUnit =
            shouldLookupArtUnit
                ? lookupArtUnit(
                    code
                  )
                : classifications[
                    code
                  ]?.artUnit || "";

        if (
            shouldLookupArtUnit
            &&
            computedArtUnit
            &&
            computedArtUnit !== "Not Found"
            &&
            classifications[code]
            &&
            classifications[code].artUnit !== computedArtUnit
        ) {

            classifications[code].artUnit =
                computedArtUnit;

            classificationStorageChanged =
                true;
        }
				
		if (
            shouldLookupArtUnit
            &&
			computedArtUnit ===
			"Not Found"
		) {
		
			missingArtUnits.push(
				code
			);
		}
	
		const barLength =
			Math.round(
				(
					data.count /
					maxCount
				) * 20
			);
	
		const bar =
			"▉".repeat(
				Math.max(
					1,
					barLength
				)
			);
			
		const cells =
			histogramColumnOrder
				.map(
					column => {
					
						const classification = classifications[code];
							
						switch (
							column
						) {
		
							case "classTitle":
							
								return `
									<td>
										${
											compactClassTitle
							
											? truncate(
												classification?.classTitle,
												20
											)
							
											: (
												classification?.classTitle
												|| ""
											)
										}
									</td>
								`;
							
							case "subclassTitle":
							
								return `
									<td>
										${
											compactSubclassTitle
							
											? truncate(
												classification?.subclassTitle,
												25
											)
							
											: (
												classification?.subclassTitle
												|| ""
											)
										}
									</td>
								`;
								
							case "class":
		
								return `
									<td>
		
										<a
											href="#"
											class="classificationFilter"
											data-code="${code}"
										>
											${code}
										</a>
		
									</td>
								`;
								
							case "artUnit":
								
									return `
										<td>
								
											<input
												class="classificationArtUnitInput"
												value="${computedArtUnit}"
												readonly
											>
								
										</td>
									`;

							case "pickArtUnit":

								return `
									<td>

										<input
											type="checkbox"
											class="pickArtUnitForValidation"
											data-code="${code}"
											${
												classification?.pickArtUnit
													? "checked"
													: ""
											}
										>

									</td>
								`;
									
							case "employee":
							
								return `
									<td>
							
										<input
											class="classificationEmployee"
											data-code="${code}"
											value="${classification?.employee || ""}"
										>
							
									</td>
								`;
							
							case "phone":
							
								return `
									<td>
							
										<input
											class="classificationPhone"
											data-code="${code}"
											value="${classification?.phone || ""}"
										>
							
									</td>
								`;
								
							case "comment":
							
								return `
									<td>
							
										<input
											class="classificationComment"
											data-code="${code}"
											value="${classification?.comment || ""}"
										>
							
									</td>
								`;
		
							case "count":
		
								return `
									<td>
										${data.count}
									</td>
								`;
		
							case "histogram":
		
								return `
									<td
										class="histogramBarCell"
									>
										${bar}
									</td>
								`;
		
							case "references":
		
								return `
									<td>
										[${refs}]
									</td>
								`;
								
							case "keep":
							
								return `
									<td>
							
										<input
											type="checkbox"
											class="keepClassification"
											data-code="${code}"
											${
												classification?.keep
													? "checked"
													: ""
											}
										>
							
									</td>
								`;
								
							case "confidence":
							
								return `
									<td>
							
										<select
											class="classificationConfidence"
											data-code="${code}"
										>
							
											${[
												"None",
												"Low",
												"Medium",
												"High",
												"Very High"
											].map(
												value => `
													<option
														value="${value}"
														${
															classification?.confidence === value
																? "selected"
																: ""
														}
													>
														${value}
													</option>
												`
											).join("")}
							
										</select>
							
									</td>
								`;
							
							case "researchTier":
							
								return `
									<td>
							
										<select
											class="classificationTier"
											data-code="${code}"
										>
							
											${[
												"None",
												"tertiary",
												"secondary",
												"primary"
											].map(
												value => `
													<option
														value="${value}"
														${
															classification?.researchTier === value
																? "selected"
																: ""
														}
													>
														${value}
													</option>
												`
											).join("")}
							
										</select>
							
									</td>
								`;
								
							case "reason":
							
								return `
									<td>
							
										<input
											class="classificationReason"
											data-code="${code}"
											value="${classification?.reason || ""}"
										>
							
									</td>
								`;

							case "artUnitReason":

								return `
									<td>

										<input
											class="classificationArtUnitReason"
											data-code="${code}"
											value="${classification?.artUnitReason || ""}"
										>

									</td>
								`;
						}
					}
				)
				.join("");
	
		tableBody.innerHTML += `
		
			<tr>
		
				${cells}
		
			</tr>
		`;
	}

    if (
        classificationStorageChanged
    ) {

        await chrome.storage.local.set({
            classifications
        });
    }
	
	if (
        stage === "artUnit"
        &&
		missingArtUnits.length
	) {
	
		console.info(
			"Missing Art Unit mappings:",
			missingArtUnits
		);
	
        showArtUnitLookupFailureDialog(
            missingArtUnits
        );
	}
        
    document
		.querySelectorAll(
			".classificationFilter"
		)
		.forEach(
			element => {
	
				element.onclick =
					event => {
	
						event.preventDefault();
	
						const code =
							element.dataset.code;
	
						filterByClassification(
							code,
							currentHistogram[
								code
							].references
						);
					};
			}
		);
		
	document
		.querySelectorAll(
			".keepClassification"
		)
		.forEach(
			checkbox => {
	
				checkbox.onchange =
					async () => {
	
						const storage =
							await chrome.storage.local.get(
								"classifications"
							);
	
						const classifications =
							storage.classifications || {};
	
						classifications[
							checkbox.dataset.code
						].keep =
							checkbox.checked;
						
						synchronizeParentClassification(
						
							checkbox.dataset.code,
						
							classifications
						);
						
						await chrome.storage.local.set({
						
							classifications
						});
					};
			}
		);
		
	document
		.querySelectorAll(
			".classificationConfidence"
		)
		.forEach(
			select => {
	
				select.onchange =
					async () => {
	
						const storage =
							await chrome.storage.local.get(
								"classifications"
							);

						storage.classifications[
							select.dataset.code
						].confidence =
							select.value;
						
						synchronizeParentClassification(
						
							select.dataset.code,
						
							storage.classifications
						);
						
						await chrome.storage.local.set({
						
							classifications:
								storage.classifications
						});
				};
			}
		);
		
	document
		.querySelectorAll(
			".classificationTier"
		)
		.forEach(
			select => {
	
				select.onchange =
					async () => {
	
						const storage =
							await chrome.storage.local.get(
								"classifications"
							);
	
						const classifications =
							storage.classifications;
	
						const currentRecord =
							classifications[
								select.dataset.code
							];

						const projectClassificationCodes =
							getProjectClassificationCodes(
								patents
							);
	
						const primaryCount =
							Object.entries(
								classifications
							)
							.filter(
						
								([code, record]) =>
						
									!isParentClassification(
										code
									)
						
									&&

									projectClassificationCodes.has(
										code
									)

									&&
						
									record.keep
						
									&&
						
									record.researchTier ===
										"primary"
							)
							.length;
	
						if (
							select.value ===
								"primary"
							&&
							currentRecord.researchTier !==
								"primary"
							&&
							primaryCount >= 4
						) {
	
							alert(
								"You can only select up to four Primary classifications."
							);
	
							select.value =
								currentRecord.researchTier;
	
							return;
						}
	
						currentRecord.researchTier =
							select.value;
						
						synchronizeParentClassification(
						
							select.dataset.code,
						
							classifications
						);
						
						await chrome.storage.local.set({
						
							classifications
						});
					};
			}
		);
		
	document
		.querySelectorAll(
			".pickArtUnitForValidation"
		)
		.forEach(
			checkbox => {

				checkbox.onchange =
					async () => {

						const storage =
							await chrome.storage.local.get(
								"classifications"
							);

						storage.classifications[
							checkbox.dataset.code
						].pickArtUnit =
							checkbox.checked;

						await chrome.storage.local.set({

							classifications:
								storage.classifications
						});
					};
			}
		);

	document
		.querySelectorAll(
			".classificationEmployee"
		)
		.forEach(
			input => {
	
				input.onblur = async () => {
	
					const storage =
						await chrome.storage.local.get(
							"classifications"
						);
	
					storage.classifications[
						input.dataset.code
					].employee =
						input.value.trim();
	
					await chrome.storage.local.set({
	
						classifications:
							storage.classifications
					});
				};
			}
		);
	
	document
		.querySelectorAll(
			".classificationPhone"
		)
		.forEach(
			input => {
	
				input.onblur = async () => {
	
					const storage =
						await chrome.storage.local.get(
							"classifications"
						);
	
					storage.classifications[
						input.dataset.code
					].phone =
						input.value.trim();
	
					await chrome.storage.local.set({
	
						classifications:
							storage.classifications
					});
				};
			}
		);
			
	document
			.querySelectorAll(
				".classificationComment"
			)
			.forEach(
				input => {
		
					input.onblur = async () => {
		
						const storage =
							await chrome.storage.local.get(
								"classifications"
							);
		
						storage.classifications[
							input.dataset.code
						].comment =
							input.value.trim();
		
						await chrome.storage.local.set({
		
							classifications:
								storage.classifications
						});
					};
				}
			);
		
	document
		.querySelectorAll(
			".classificationArtUnitReason"
		)
		.forEach(
			input => {

				input.onblur =
					async () => {

						const storage =
							await chrome.storage.local.get(
								"classifications"
							);

						storage.classifications[
							input.dataset.code
						].artUnitReason =
							input.value.trim();

						await chrome.storage.local.set({

							classifications:
								storage.classifications
						});
					};
			}
		);

	document
		.querySelectorAll(
			".classificationReason"
		)
		.forEach(
			input => {
	
				input.onblur =
					async () => {
	
						const storage =
							await chrome.storage.local.get(
								"classifications"
							);
	
						storage.classifications[
							input.dataset.code
						].reason =
							input.value.trim();
						
						synchronizeParentClassification(
						
							input.dataset.code,
						
							storage.classifications
						);
						
						await chrome.storage.local.set({
						
							classifications:
								storage.classifications
						});
					};
			}
		);
		
	enableHistogramDragDrop();
	
	document
		.getElementById(
			"compactClassTitle"
		)
		.onchange =
		event => {
	
			compactClassTitle =
				event.target.checked;
	
			renderHistogram(
				currentHistogram,
				title
			);
		};
	
	const compactSubclassCheckbox =
		document.getElementById(
			"compactSubclassTitle"
		);
	
	if (
		compactSubclassCheckbox
	) {
	
		compactSubclassCheckbox.onchange =
			event => {
	
				compactSubclassTitle =
					event.target.checked;
	
				renderHistogram(
					currentHistogram,
					title
				);
			};
	}
	
	document
		.getElementById(
			"copyHistogram"
		)
		.onclick =
		async () => {
	
			const rows = [];
	
			rows.push(title);
	
			rows.push(
				histogramColumnOrder
					.map(
						column =>
							HISTOGRAM_HEADER_MAP[
								column
							]
					)
					.join("\t")
			);
	
			for (
				const [code, data]
				of sorted
			) {
	
				const classification =
					classifications[
						code
					] || {};

				const computedArtUnit =
                    stage === "artUnit"
                        ? lookupArtUnit(
                            code
                          )
                        : classification.artUnit || "";
	
				const refs =
					"[" +
					data.references
						.sort(
							(
								a,
								b
							) => a - b
						)
						.join(",") +
					"]";
	
				const barLength =
					Math.round(
						(
							data.count /
							maxCount
						) * 20
					);
	
				const bar =
					"▉".repeat(
						Math.max(
							1,
							barLength
						)
					);
	
				const values =
					histogramColumnOrder.map(
						column => {
	
							switch (
								column
							) {
	
								case "class":
	
									return code;
									
								case "artUnit":
								
									return computedArtUnit;

								case "pickArtUnit":

									return classification.pickArtUnit
										? "☑"
										: "☐";
									
								case "employee":
								
									return classification.employee || "";
								
								case "phone":
								
									return classification.phone || "";
									
								case "comment":
								
									return classification.comment || "";
	
								case "classTitle":
	
									return (
										classification.classTitle
										|| ""
									);
	
								case "subclassTitle":
	
									return (
										classification.subclassTitle
										|| ""
									);
	
								case "count":
	
									return data.count;
	
								case "histogram":
	
									return bar;
	
								case "references":
	
									return refs;
								
								case "keep":
								
									return classification.keep
										? "☑"
										: "☐";
										
								case "confidence":
								
									return classification.confidence || "";
									
								case "researchTier":
								
									return classification.researchTier || "";
								
								case "reason":

									return classification.reason || "";

								case "artUnitReason":

									return classification.artUnitReason || "";

								default:
	
									return "";
							}
						}
					);
	
				rows.push(
					values.join("\t")
				);
			}
	
			await navigator.clipboard.writeText(
				rows.join("\n")
			);
	
			alert(
				"Histogram copied."
			);
		};
}

function truncate(
    text,
    maxLength
) {

    if (
        !text
    ) {

        return "";
    }

    return text.length >
        maxLength

        ? text.slice(
            0,
            maxLength
        ) + "..."

        : text;
}

function setupEditButtons() {

    document
        .querySelectorAll(
            ".editPatent"
        )
        .forEach(
            button => {

                button.onclick =
                    () => {

                        currentPatentIndex =
                            Number(
                                button.dataset.index
                            );

                        const patent =
                            patents[
                                currentPatentIndex
                            ];

                        document
                            .getElementById(
                                "editPatentNumber"
                            )
                            .value =
                            patent.patentNumber || "";

                        document
                            .getElementById(
                                "editTitle"
                            )
                            .value =
                            patent.title || "";
                            
                        document
							.getElementById(
								"editAbstract"
							)
							.value =
							patent.abstract || "";

                        if (
                            document.getElementById(
                                "editClaims"
                            )
                        ) {

                            document
                                .getElementById(
                                    "editClaims"
                                )
                                .value =
                                patent.claims || "";
                        }

                        if (
                            document.getElementById(
                                "editChallengingClaimNumbers"
                            )
                        ) {

                            document
                                .getElementById(
                                    "editChallengingClaimNumbers"
                                )
                                .value =
                                patent.challengingClaimNumbers || "";
                        }
						
						document
							.getElementById(
								"editInventorName"
							)
							.value =
							patent.inventorName || "";

                        document
                            .getElementById(
                                "editRelevance"
                            )
                            .value =
                            patent.relevance || "";

                        if (
                            document.getElementById(
                                "editOverlap"
                            )
                        ) {

                            document
                                .getElementById(
                                    "editOverlap"
                                )
                                .value =
                                patent.overlap || "None";
                        }

                        if (
                            document.getElementById(
                                "editWhyItMatters"
                            )
                        ) {

                            document
                                .getElementById(
                                    "editWhyItMatters"
                                )
                                .value =
                                patent.whyItMatters || "";
                        }

                        document
                            .getElementById(
                                "editAssignee"
                            )
                            .value =
                            patent.assignee || "";
                            
                        document
							.getElementById(
								"editApplicationNumber"
							)
							.value =
							patent.applicationNumber || "";
						
						document
							.getElementById(
								"editFilingDate"
							)
							.value =
							patent.filingDate || "";
						
						document
							.getElementById(
								"editPublicationDate"
							)
							.value =
							patent.publicationDate || "";
							
						document
							.getElementById(
								"editPrimaryClass"
							)
							.value =
							patent.primaryClass || "";
						
						document
							.getElementById(
								"editOtherClasses"
							)
							.value =
							(patent.otherClasses || [])
								.join("\n");

                        document
                            .getElementById(
                                "editUrl"
                            )
                            .value =
                            patent.url || "";
                            
                        document
							.getElementById(
								"editCpc"
							)
							.value =
							(patent.cpc || [])
								.join("\n");
						
						document
							.getElementById(
								"editUspc"
							)
							.value =
							(patent.uspc || [])
								.join("\n");

                        document
                            .getElementById(
                                "editPatentDialog"
                            )
                            .style.display =
                            "block";
                    };
            }
        );
}

async function renderEditFields() {

    const container =
        document.getElementById(
            "editPatentFields"
        );

    container.innerHTML = "";

    const columnOrder =
        await getColumnOrder();

    for (
        const column
        of columnOrder
    ) {

        const field =
            EDIT_FIELD_MAP[column];

        if (!field) {

            continue;
        }

        let control = "";

        if (
            field.type ===
            "textarea"
        ) {

            control = `
                <textarea
                    id="${field.id}"
                    class="editFieldTextarea"
                    ${
                        field.readonly
                            ? "readonly"
                            : ""
                    }
                ></textarea>
            `;
        }

        else if (
            field.type ===
            "select"
        ) {

            control = `
                <select
                    id="${field.id}"
                >
                    ${
                        field.options
                            .map(
                                option => `
                                    <option value="${option}">
                                        ${option}
                                    </option>
                                `
                            )
                            .join("")
                    }
                </select>
            `;
        }

        else {

            control = `
                <input
                    id="${field.id}"
                    class="editFieldControl"
                    ${
                        field.readonly
                            ? "readonly"
                            : ""
                    }
                >
            `;
        }
    
        container.innerHTML += `

            <label>
                ${field.label}
            </label>

            ${control}

            <br><br>
        `;
    }
    
    const extraFields = [
		
			"url",
			"cpc",
			"uspc"
		];
		
		for (
			const column
			of extraFields
		)
		{
			const field =
				EDIT_FIELD_MAP[column];
		
			let control = "";
		
			if (
				field.type ===
				"textarea"
			) {
		
				control = `
					<textarea
						id="${field.id}"
						class="editFieldTextarea"
						readonly
					></textarea>
				`;
			}
		
			else {
		
				control = `
					<input
						id="${field.id}"
						class="editFieldControl"
						readonly
					>
				`;
			}
		
			container.innerHTML += `
		
				<label>
					${field.label}
				</label>
		
				${control}
		
				<br><br>
			`;
		}
}

function setupEditDialog() {

    document
        .getElementById(
            "cancelPatentEdit"
        )
        .onclick =
        () => {

            document
                .getElementById(
                    "editPatentDialog"
                )
                .style.display =
                "none";
        };

    document
        .getElementById(
            "savePatentChanges"
        )
        .onclick =
        async () => {

            const patent =
                patents[
                    currentPatentIndex
                ];

            patent.patentNumber =
                document
                    .getElementById(
                        "editPatentNumber"
                    )
                    .value
                    .trim();

            patent.title =
                document
                    .getElementById(
                        "editTitle"
                    )
                    .value
                    .trim();

            patent.relevance =
                document
                    .getElementById(
                        "editRelevance"
                    )
                    .value;

            if (
                document.getElementById(
                    "editOverlap"
                )
            ) {

                patent.overlap =
                    document
                        .getElementById(
                            "editOverlap"
                        )
                        .value;
            }

            if (
                document.getElementById(
                    "editWhyItMatters"
                )
            ) {

                patent.whyItMatters =
                    document
                        .getElementById(
                            "editWhyItMatters"
                        )
                        .value
                        .trim();
            }

            patent.assignee =
                document
                    .getElementById(
                        "editAssignee"
                    )
                    .value
                    .trim();
                    
            patent.abstract =
				document
					.getElementById(
						"editAbstract"
					)
					.value
					.trim();

            if (
                document.getElementById(
                    "editClaims"
                )
            ) {

                patent.claims =
                    document
                        .getElementById(
                            "editClaims"
                        )
                        .value
                        .trim();
            }

            if (
                document.getElementById(
                    "editChallengingClaimNumbers"
                )
            ) {

                patent.challengingClaimNumbers =
                    document
                        .getElementById(
                            "editChallengingClaimNumbers"
                        )
                        .value
                        .trim();
            }
			
			patent.inventorName =
				document
					.getElementById(
						"editInventorName"
					)
					.value
					.trim();
                    
            patents.forEach(
					(
						patent,
						index
					) => {
				
						patent.referenceId =
							index + 1;
					}
				);

            await savePatents(
                patents
            );

            location.reload();
        };

    document
        .getElementById(
            "deletePatentRecord"
        )
        .onclick =
        async () => {

            if (
                !confirm(
                    "Delete this patent?"
                )
            ) {

                return;
            }

            patents.splice(
			currentPatentIndex,
			1
		);
		
		patents.forEach(
			(
				patent,
				index
			) => {
		
				patent.referenceId =
					index + 1;
			}
		);
		
		await savePatents(
			patents
		);

            location.reload();
        };
}

init();

async function refreshCurrentView() {

    if (
        currentView === "references"
    ) {

        return;
    }

    await updateCurrentHistogram();
}

async function refreshCurrentPatentTableFromStorage() {

    const visiblePatentIds =
        new Set(
            currentTablePatents.map(
                getPatentSelectionId
            )
        );

    patents =
        await getPatents();

    patents.forEach(
        (
            patent,
            index
        ) => {

            patent.referenceId =
                index + 1;
        }
    );

    for (
        const patent
        of patents
    ) {

        selectedPatentIds.add(
            getPatentSelectionId(
                patent
            )
        );
    }

    const stagePatents =
        await getPatentsForCurrentStage();

    await renderCurrentPatentTable(
        activeClassificationFilter
            ? stagePatents.filter(
                patent =>
                    visiblePatentIds.has(
                        getPatentSelectionId(
                            patent
                        )
                    )
              )
            : stagePatents
    );

    await renderEditFields();
}

chrome.storage.onChanged.addListener(

    async (
        changes,
        area
    ) => {

        if (
            area !== "local"
        ) {

            return;
        }

        if (
            changes.classifications
        ) {

            await refreshCurrentView();
        }

        if (
            changes.patents
        ) {

            await refreshCurrentPatentTableFromStorage();
        }
    }
);
