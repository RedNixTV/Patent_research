export const DEFAULT_COLUMNS = [

    "patentNumber",
    "title",
    "abstract",
    "inventorName",
    "assignee",
    "applicationNumber",
    "filingDate",
    "publicationDate",
    "primaryClass",
    "otherClasses",
    "relevance",
    "universeReviewSelected",
    "finalReferenceSelected",
    "overlap",
    "claims",
    "challengingClaimNumbers",
    "bullseyeScore",
    "bullseye",
    "whyItMatters"
];

const REVIEW_CONCEPT_COLUMN_PREFIX =
    "reviewConcept:";

export const COLUMN_DEFINITIONS = {

    patentNumber: {
        label: "Doc Num"
    },

    title: {
        label: "Title"
    },

    abstract: {
        label: "Abstract"
    },

    inventorName: {
        label: "Inventor"
    },

    assignee: {
        label: "Assignee"
    },

    applicationNumber: {
        label: "Application"
    },

    filingDate: {
        label: "Filing Date"
    },

    publicationDate: {
        label: "Pub Date"
    },

    primaryClass: {
        label: "Primary Class"
    },

    otherClasses: {
        label: "Other Classes"
    },

    relevance: {
        label: "Relevance"
    },

    universeReviewSelected: {
        label: "Review"
    },

    finalReferenceSelected: {
        label: "Final Reference"
    },

    overlap: {
        label: "Overlap"
    },

    claims: {
        label: "Claims"
    },

    challengingClaimNumbers: {
        label: "Challenge Claims"
    },

    bullseyeScore: {
        label: "Score"
    },

    bullseye: {
        label: "Bullseye"
    },

    whyItMatters: {
        label: "Why it matters"
    }
};

const COLUMN_RENDERERS = {

    patentNumber:
		patent =>
			patent.url
	
				? `
					<a
						href="${patent.url}"
						target="_blank"
						title="Open patent"
					>
						${patent.patentNumber || ""}
					</a>
				  `
	
				: (patent.patentNumber || ""),

    title:
		(
			patent,
			options
		) =>
	
			options.compactTitle
	
				? truncate(
					patent.title,
					30
				  )
	
				: (patent.title || ""),

    abstract:
			(
				patent,
				options
			) =>
		
				options.compactAbstract
		
					? truncate(
						patent.abstract,
						60
					  )
		
					: (patent.abstract || ""),

    inventorName:
        patent =>
            patent.inventorName || "",

    assignee:
        patent =>
            patent.assignee || "",

    applicationNumber:
        patent =>
            patent.applicationNumber || "",

    filingDate:
        patent =>
            patent.filingDate || "",

    publicationDate:
        patent =>
            patent.publicationDate || "",

    primaryClass:
        patent =>
            patent.primaryClass || "",

    otherClasses:
        patent =>
            (patent.otherClasses || [])
                .slice(0, 3)
                .join(", "),

    relevance:
        patent => {

            const value =
                patent.relevance || "none";

            const options = ["none", "weak","partial","strong"];

            return `
                <select
                    class="patentFieldControl patentRelevanceSelect"
                    data-field="relevance"
                    data-patent-id="${escapeAttribute(getPatentSelectionId(patent))}"
                >
                    ${
                        options
                            .map(
                                option => `
                                    <option
                                        value="${escapeAttribute(option)}"
                                        ${option === value ? "selected" : ""}
                                    >
                                        ${option}
                                    </option>
                                `
                            )
                            .join("")
                    }
                </select>
            `;
        },

    universeReviewSelected:
        patent => `
            <input
                type="checkbox"
                class="patentFieldControl patentReviewCheckbox"
                data-field="universeReviewSelected"
                data-patent-id="${escapeAttribute(getPatentSelectionId(patent))}"
                ${patent.universeReviewSelected ? "checked" : ""}
                title="Show in Universe Review"
            >
        `,

    finalReferenceSelected:
        patent => `
            <input
                type="checkbox"
                class="patentFieldControl patentFinalReferenceCheckbox"
                data-field="finalReferenceSelected"
                data-patent-id="${escapeAttribute(getPatentSelectionId(patent))}"
                ${patent.finalReferenceSelected ? "checked" : ""}
                title="Select for Final References (maximum 20)"
            >
        `,

    overlap:
        patent => {

            const value =
                patent.overlap || "None";

            const options = ["None","Low","Medium","High", "Very High"];

            return `
                <select
                    class="patentFieldControl patentOverlapSelect"
                    data-field="overlap"
                    data-patent-id="${escapeAttribute(getPatentSelectionId(patent))}"
                >
                    ${
                        options
                            .map(
                                option => `
                                    <option
                                        value="${escapeAttribute(option)}"
                                        ${option === value ? "selected" : ""}
                                    >
                                        ${option}
                                    </option>
                                `
                            )
                            .join("")
                    }
                </select>
            `;
        },

    whyItMatters:
        patent => `
            <textarea
                class="patentFieldControl patentWhyItMattersTextarea"
                data-field="whyItMatters"
                data-patent-id="${escapeAttribute(getPatentSelectionId(patent))}"
            >${escapeHtml(patent.whyItMatters || "")}</textarea>
        `,

    claims:
        patent => `
            <textarea
                class="patentFieldControl patentClaimsTextarea"
                data-field="claims"
                data-patent-id="${escapeAttribute(getPatentSelectionId(patent))}"
            >${escapeHtml(patent.claims || "")}</textarea>
        `,

    challengingClaimNumbers:
        patent => `
            <textarea
                class="patentFieldControl patentChallengeClaimsTextarea"
                data-field="challengingClaimNumbers"
                data-patent-id="${escapeAttribute(getPatentSelectionId(patent))}"
            >${escapeHtml(patent.challengingClaimNumbers || "")}</textarea>
        `
};

function truncate(
    text,
    maxLength
) {

    if (!text) {

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

export function renderHeaders(
    columnOrder,
    options = {}
) {

    const headerRow =
        document.getElementById(
            "headerRow"
        );

    headerRow.innerHTML = "";

    const allSelected =
        options.allSelected ?? true;

    const allReviewSelected =
        options.allReviewSelected ?? false;

    const someReviewSelected =
        options.someReviewSelected ?? false;

    const reviewConcepts =
        options.reviewConcepts || [];

    const scoreSortDirection =
        options.scoreSortDirection ||
        null;

    const finalReferenceSelectedCount =
        options.finalReferenceSelectedCount ||
        0;

    headerRow.innerHTML = `
        <th class="patentSelectionHeader">
            <input
                type="checkbox"
                id="selectAllPatents"
                title="Select all patents for histogram"
                ${allSelected ? "checked" : ""}
            >
            <span>#</span>
        </th>
    `;

    for (
        const column
        of columnOrder
    ) {

        if (
            column ===
            "universeReviewSelected"
        ) {

            headerRow.innerHTML += `

                <th
                    draggable="true"
                    data-column="${column}"
                    class="patentReviewHeader"
                >
                    <input
                        type="checkbox"
                        id="selectAllReviewPatents"
                        title="Select all patents for Universe Review"
                        ${allReviewSelected ? "checked" : ""}
                    >
                    <span>
                        ${getColumnLabel(
                            column,
                            reviewConcepts
                        )}
                    </span>
                </th>
            `;

            continue;
        }

        if (
            isReviewConceptColumn(
                column
            )
        ) {

            const concept =
                getReviewConceptForColumn(
                    column,
                    reviewConcepts
                );

            headerRow.innerHTML += `

                <th
                    draggable="true"
                    data-column="${column}"
                    data-concept-id="${escapeAttribute(concept?.id || "")}"
                    data-concept-definition="${escapeAttribute(concept?.definition || "")}"
                    class="patentReviewConceptHeader"
                    title="${escapeAttribute(getConceptHeaderTitle(concept))}"
                >
                    ${
                        getColumnLabel(
                            column,
                            reviewConcepts
                        )
                    }
                </th>
            `;

            continue;
        }

        if (
            column ===
            "finalReferenceSelected"
        ) {

            headerRow.innerHTML += `

                <th
                    draggable="true"
                    data-column="${column}"
                    title="Select up to 20 patents for Final References"
                >
                    Final (${finalReferenceSelectedCount}/20)
                </th>
            `;

            continue;
        }

        if (
            column ===
            "bullseyeScore"
        ) {

            const sortIndicator =
                scoreSortDirection ===
                    "descending"
                    ? " ▼"
                    : scoreSortDirection ===
                        "ascending"
                        ? " ▲"
                        : "";

            headerRow.innerHTML += `

                <th
                    draggable="true"
                    data-column="${column}"
                    class="patentScoreHeader"
                    title="Sort patents by score"
                >
                    ${
                        getColumnLabel(
                            column,
                            reviewConcepts
                        )
                    }${sortIndicator}
                </th>
            `;

            continue;
        }

        headerRow.innerHTML += `

            <th
                draggable="true"
                data-column="${column}"
            >
                ${
                    getColumnLabel(
                        column,
                        reviewConcepts
                    )
                }
            </th>
        `;
    }
}

export function renderPatentTable(
    patents,
    columnOrder,
    options = {}
){

    const compactTitle =
		options.compactTitle ?? false;
	
    const compactAbstract =
		options.compactAbstract ?? false;

    const selectedPatentIds =
        options.selectedPatentIds ||
        new Set(
            patents.map(
                getPatentSelectionId
            )
        );

    const referenceIdRenderer =
        options.referenceIdRenderer ||
        (
            patent =>
                patent.referenceId
        );

    const reviewConcepts =
        options.reviewConcepts || [];
    
    columnOrder =
        columnOrder ||
        DEFAULT_COLUMNS;
        
    const tbody =
        document.querySelector(
            "#patentTable tbody"
        );

    tbody.innerHTML = "";

    patents.forEach(
        (
            patent,
            index
        ) => {

            const row =
                document.createElement(
                    "tr"
                );

            const selectionId =
                getPatentSelectionId(
                    patent
                );

            const displayReferenceId =
                referenceIdRenderer(
                    patent,
                    index
                );

            let html = `
			
				<td
                    class="patentReferenceCell"
                    data-reference-id="${escapeAttribute(displayReferenceId)}"
                >

                    <input
                        type="checkbox"
                        class="patentSelectionCheckbox"
                        data-patent-id="${escapeAttribute(selectionId)}"
                        title="Include patent in histogram"
                        ${selectedPatentIds.has(selectionId) ? "checked" : ""}
                    >
			
					<span
						class="editPatent"
						data-index="${
							patent.originalIndex ??
							index
						}"
						title="Edit Patent"
					>
						✏️
					</span>
			
					${displayReferenceId}
			
				</td>
			`;
			
			for (
					const column
					of columnOrder
				) {
				
					const value =
							getColumnRenderer(
                                column,
                                reviewConcepts
                            )(
								patent,
								{
									compactTitle,
									compactAbstract
								}
							);
				
					html += `
				
						<td>
							${value}
						</td>
					`;
				}
				
			row.innerHTML = html;

            tbody.appendChild(
                row
            );
        }
    );
}

export function getReviewConceptColumnKey(
    conceptId
) {

    return `${REVIEW_CONCEPT_COLUMN_PREFIX}${conceptId}`;
}

function getColumnLabel(
    column,
    reviewConcepts
) {

    if (
        isReviewConceptColumn(
            column
        )
    ) {

        const concept =
            getReviewConceptForColumn(
                column,
                reviewConcepts
            );

        return concept?.label || "Concept";
    }

    return COLUMN_DEFINITIONS[
        column
    ]?.label || column;
}

function getColumnRenderer(
    column,
    reviewConcepts
) {

    if (
        isReviewConceptColumn(
            column
        )
    ) {

        const concept =
            getReviewConceptForColumn(
                column,
                reviewConcepts
            );

        return patent => {

            const conceptId =
                concept?.id;

            const value =
                patent.conceptScores?.[
                    conceptId
                ] ??
                (
                    patent.conceptCoverage?.[
                        conceptId
                    ]
                        ? "2"
                        : "0"
                );

            const scoreOptions = [
                {
                    value: "2",
                    label: "Red",
                    color: "red"
                },
                {
                    value: "1",
                    label: "Yellow",
                    color: "yellow"
                },
                {
                    value: "0",
                    label: "Green",
                    color: "green"
                }
            ];

            const selectedColor =
                scoreOptions.find(
                    option =>
                        option.value ===
                        String(value)
                )?.color ||
                "green";

            return `
                <select
                    class="patentFieldControl patentConceptScoreSelect patentConceptScore-${selectedColor}"
                    data-field="conceptScores"
                    data-concept-id="${escapeAttribute(conceptId || "")}"
                    data-patent-id="${escapeAttribute(getPatentSelectionId(patent))}"
                    aria-label="${scoreOptions.find(option => option.value === String(value))?.label || "Green"} concept score"
                    title="${escapeAttribute(getConceptCellTitle(concept))}"
                >
                    ${
                        scoreOptions
                            .map(
                                option => `
                                    <option
                                        value="${option.value}"
                                        class="patentConceptScoreOption-${option.color}"
                                        aria-label="${option.label} (Score ${option.value})"
                                        ${String(value) === option.value ? "selected" : ""}
                                    >
                                        ${option.label}
                                    </option>
                                `
                            )
                            .join("")
                    }
                </select>
            `;
        };
    }

    if (
        column ===
        "bullseyeScore"
    ) {

        return patent =>
            String(
                getBullseyeScore(
                    patent,
                    reviewConcepts
                )
            );
    }

    if (
        column ===
        "bullseye"
    ) {

        return patent =>
            getBullseyeLabel(
                getBullseyeScore(
                    patent,
                    reviewConcepts
                )
            );
    }

    return COLUMN_RENDERERS[column];
}

function isReviewConceptColumn(
    column
) {

    return column.startsWith(
        REVIEW_CONCEPT_COLUMN_PREFIX
    );
}

function getReviewConceptForColumn(
    column,
    reviewConcepts
) {

    return reviewConcepts.find(
        candidate =>
            getReviewConceptColumnKey(
                candidate.id
            ) === column
    );
}

function getConceptHeaderTitle(
    concept
) {

    const definition =
        concept?.definition
            ?.trim();

    return definition
        ? `${definition}\nClick to define or delete this concept column`
        : "Click to define or delete this concept column";
}

function getConceptCellTitle(
    concept
) {

    const definition =
        concept?.definition
            ?.trim();

    const scoring =
        concept?.scoring || {};

    const scoringText =
        [
            scoring["2"]
                ? `Red (Score 2): ${scoring["2"]}`
                : "",
            scoring["1"]
                ? `Yellow (Score 1): ${scoring["1"]}`
                : "",
            scoring["0"]
                ? `Green (Score 0): ${scoring["0"]}`
                : ""
        ]
            .filter(Boolean)
            .join("\n");

    return [
        definition,
        scoringText
    ]
        .filter(Boolean)
        .join("\n\n") ||
        "Score this concept";
}

export function getBullseyeScore(
    patent,
    reviewConcepts
) {

    return reviewConcepts.reduce(
        (
            total,
            concept
        ) => {

            const conceptId =
                concept?.id;

            const score =
                patent.conceptScores?.[
                    conceptId
                ] ??
                (
                    patent.conceptCoverage?.[
                        conceptId
                    ]
                        ? "2"
                        : "0"
                );

            return total +
                (
                    Number.parseInt(
                        score,
                        10
                    ) ||
                    0
                );
        },
        0
    );
}

function getBullseyeLabel(
    score
) {

    if (
        score >= 12
    ) {

        return "Bullseye";
    }

    if (
        score >= 9
    ) {

        return "Inner Ring";
    }

    if (
        score >= 6
    ) {

        return "Middle Ring";
    }

    if (
        score >= 3
    ) {

        return "Outer Ring";
    }

    return "Miss";
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

function escapeAttribute(
    value
) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function escapeHtml(
    value
) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
