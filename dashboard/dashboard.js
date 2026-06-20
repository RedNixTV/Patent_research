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
let currentPatentIndex =
    null;
let activeClassificationFilter =
    null;
let currentView =
    "references";
let currentHistogram =
    {};
    
const DEFAULT_HISTOGRAM_COLUMNS = [

    "class",
    "count",
    "histogram",
    "references"
];

const HISTOGRAM_HEADER_MAP = {

    class:
        "Cls",

    count:
        "#",

    histogram:
        "Histogram",

    references:
        "Refs"
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

    switch (
        project.workflow
            ?.currentStage
    ) {

        case "landscapeScan":

            container.innerHTML = "";

            break;

        case "referenceList":

            container.innerHTML = `
                <p>
                    Coming Soon
                </p>
            `;

            break;

        case "universe":

            container.innerHTML = `

                <p>
                    Coming Soon
                </p>
            `;

            break;

        default:

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
        columnOrder
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
        columnOrder
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
                        order
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
		columnOrder
	);
	
	await renderEditFields();
    
    setupEditButtons();
    enableColumnDragDrop();
	setupEditDialog();
	
	document
    .getElementById(
        "workflowSelector"
    )
    .onchange =
    async e => {

        await saveCurrentStage(
            e.target.value
        );

        await renderCurrentStage();
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
			"uspcTab"
		)
		.onclick =
		async () => {
		
			currentView =
				"uspc";
		
			await renderUspcHistogram();
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
        currentView ===
        "uspc"
    ) {

        await renderUspcHistogram();
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
            ? "Top CPC Classes"
            : "Top CPC Subclasses"
    );
}

async function renderUspcHistogram() {

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
				"uspc"
			)
			: buildSubclassHistogramWithReferences(
				patents,
				"uspc"
			);

    await renderHistogram(
        histogram,
        showFull
            ? "Top USPC Classes"
            : "Top USPC Main Classes"
    );
}

    
async function renderHistogram(
    histogram,
    title
) {
	currentHistogram =
    histogram;
    
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
	
		<h3>${title}</h3>
	
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
		
						switch (
							column
						) {
		
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
		
	enableHistogramDragDrop();
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