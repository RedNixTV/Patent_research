import {
    getPatents,
    savePatents,
    getProjects,
    switchProject,
    createProject,
    deleteProject,
    getCurrentProject
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
    DEFAULT_COLUMNS
}
from "./patentTable.js";

import {
    WORKFLOW_STAGES
}
from "./workflow.js";

let patents = [];
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
    
    examinerValidation: [
	
		"class",
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
	
	reason: "Reason"
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
        type: "select"
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
		
			container.innerHTML = "";
		
			cpcTab.style.display =
				"none";
		
			primaryUspcTab.style.display =
				"none";
		
			otherUspcTab.style.display =
				"none";
		
			classificationTab.style.display =
				"";
		
			currentView =
				"classification";
				
			container.innerHTML = `

                <p>
                    Coming Soon
                </p>
            `;

            break;
            
        case "examinerValidation":
		
			container.innerHTML = "";
		
			cpcTab.style.display = "none";
		
			primaryUspcTab.style.display =
				"none";
		
			otherUspcTab.style.display =
				"none";
		
			classificationTab.style.display =
				"";
		
			currentView =
				"classification";
		
			break;

        case "universe":

            currentView = "cpc";
            
            container.innerHTML = `

                <p>
                    Coming Soon
                </p>
            `;

            break;

        default:

            currentView = "cpc";
            container.innerHTML = "";
    }
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

    const filteredPatents =
		patents
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

    const columnOrder =
        await getColumnOrder();

    renderPatentTable(
		filteredPatents,
		columnOrder,
		{
			compactTitle:
				compactPatentTitle,
	
			compactAbstract:
				compactPatentAbstract
		}
	);

    setupEditButtons();
}

async function clearClassificationFilter() {

    activeClassificationFilter =
        null;

    const columnOrder =
        await getColumnOrder();

    renderPatentTable(
		patents,
		columnOrder,
		{
			compactTitle:
				compactPatentTitle,
	
			compactAbstract:
				compactPatentAbstract
		}
	);

    setupEditButtons();
}

async function getColumnOrder() {

    const result =
        await chrome.storage.local.get(
            "columnOrder"
        );

    return (
        result.columnOrder ||
        DEFAULT_COLUMNS
    );
}

async function saveColumnOrder(
    order
) {

    await chrome.storage.local.set({

        columnOrder:
            order
    });
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

                    renderHeaders(
                        order
                    );

                    renderPatentTable(
						patents,
						order,
						{
							compactTitle:
								compactPatentTitle,
					
							compactAbstract:
								compactPatentAbstract
						}
					);
                    
                    await renderEditFields();

                    setupEditButtons();

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

    const columnOrder =
		await getColumnOrder();
	
	renderHeaders(
		columnOrder
	);
	
	renderPatentTable(
		patents,
		columnOrder,
		{
			compactTitle:
				compactPatentTitle,
	
			compactAbstract:
				compactPatentAbstract
		}
	);
	
	await renderEditFields();
    
    setupEditButtons();
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
				
			const order = await getColumnOrder();
	
			renderPatentTable(
				patents,
				order,
				{
					compactTitle:
						compactPatentTitle,
	
					compactAbstract:
						compactPatentAbstract
				}
			);
	
			setupEditButtons();
		};
	
	document
		.getElementById(
			"compactPatentAbstract"
		)
		.onchange =
		async event => {
	
			compactPatentAbstract =
				event.target.checked;
				
			const order = await getColumnOrder();
	
			renderPatentTable(
				patents,
				order,
				{
					compactTitle:
						compactPatentTitle,
	
					compactAbstract:
						compactPatentAbstract
				}
			);
	
			setupEditButtons();
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

    const showFull =
        document
            .getElementById(
                "showFullClasses"
            )
            .checked;

    const histogram =
		showFull
			? buildHistogramWithReferences(
				patents,
				"allCpc"
			)
			: buildSubclassHistogramWithReferences(
				patents,
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

    const showFull =
        document
            .getElementById(
                "showFullClasses"
            )
            .checked;

    const histogram =
        showFull

            ? buildPrimaryUspcHistogramWithReferences(
                patents
              )

            : buildPrimaryUspcSubclassHistogramWithReferences(
                patents
              );

    await renderHistogram(

        histogram,

        showFull

            ? "Top Primary USPC Classes"

            : "Top Primary USPC Main Classes"
    );
}

async function renderOtherUspcHistogram() {

    const showFull =
        document
            .getElementById(
                "showFullClasses"
            )
            .checked;

    const histogram =
        showFull
				? buildOtherUspcHistogramWithReferences(
					patents
				  )
				: buildOtherUspcSubclassHistogramWithReferences(
					patents
				  );

    await renderHistogram(

        histogram,

        showFull

            ? "Top Other USPC Classes"

            : "Top Other USPC Main Classes"
    );
}

async function renderClassificationHistogram() {

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
                patents,
                "allCpc"
            )

            : buildSubclassHistogramWithReferences(
                patents,
                "cpc"
            )
    );

    mergeHistogram(

        showFull

            ? buildPrimaryUspcHistogramWithReferences(
                patents
            )

            : buildPrimaryUspcSubclassHistogramWithReferences(
                patents
            )
    );

    mergeHistogram(

        showFull

            ? buildOtherUspcHistogramWithReferences(
                patents
            )

            : buildOtherUspcSubclassHistogramWithReferences(
                patents
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
            "none";

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
    
async function renderHistogram(
    histogram,
    title
) {
	currentHistogram =
    histogram;
    
    const project =
		await getCurrentProject();
	
	const stage =
		project.workflow
			?.currentStage;
			
	const storage =
		await chrome.storage.local.get(
			"classifications"
		);
    
	const classifications =
		storage.classifications || {};
		
	if (
		stage ===
		"examinerValidation"
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
		
			<label
				style="
					margin-left:12px;
				"
			>
		
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

	
	const histogramColumnOrder =
		HISTOGRAM_COLUMNS_BY_STAGE[
			stage
		]
		??
		await getHistogramColumnOrder();
	
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
											style="width:250px;"
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
	
	document
		.getElementById(
			"compactSubclassTitle"
		)
		.onchange =
		event => {
	
			compactSubclassTitle =
				event.target.checked;
	
			renderHistogram(
				currentHistogram,
				title
			);
		};
	
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
                    style="
                        width:100%;
                        height:120px;
                    "
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
                    <option value="strong">
                        Strong
                    </option>

                    <option value="partial">
                        Partial
                    </option>

                    <option value="weak">
                        Weak
                    </option>
                </select>
            `;
        }

        else {

            control = `
                <input
                    id="${field.id}"
                    style="width:100%;"
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
						style="
							width:100%;
							height:120px;
						"
						readonly
					></textarea>
				`;
			}
		
			else {
		
				control = `
					<input
						id="${field.id}"
						style="width:100%;"
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
    }
);