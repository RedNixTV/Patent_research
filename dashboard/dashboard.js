import {
    getPatents,
    savePatents
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

let patents = [];
let currentPatentIndex =
    null;
let currentView =
    "references";
    
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

                    setupEditButtons();

                    enableColumnDragDrop();
                }
            );
        }
    );
}

async function init() {

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
    
    setupEditButtons();
    enableColumnDragDrop();
	setupEditDialog();

    document
		.getElementById(
			"cpcTab"
		)
		.onclick =
		() => {
	
			currentView =
				"cpc";
	
			renderCpcHistogram();
		};

    document
		.getElementById(
			"uspcTab"
		)
		.onclick =
		() => {
	
			currentView =
				"uspc";
	
			renderUspcHistogram();
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
}

function updateCurrentHistogram() {

    if (
        currentView ===
        "cpc"
    ) {

        renderCpcHistogram();
    }

    else if (
        currentView ===
        "uspc"
    ) {

        renderUspcHistogram();
    }
}

function showReferences() {

    document
        .getElementById(
            "histogramOutput"
        )
        .textContent = "";
}

function renderCpcHistogram() {

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

    renderHistogram(
        histogram,
        showFull
            ? "Top CPC Classes"
            : "Top CPC Subclasses"
    );
}

function renderUspcHistogram() {

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

    renderHistogram(
        histogram,
        showFull
            ? "Top USPC Classes"
            : "Top USPC Main Classes"
    );
}

function renderHistogram(
    histogram,
    title
) {

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

    let output =
        `${title}\n\n`;

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
			
			output +=
				`${code.padEnd(
					20,
					"."
				)} ${data.count} [${refs}]\n`;
    }

    document
        .getElementById(
            "histogramOutput"
        )
        .textContent =
        output;
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