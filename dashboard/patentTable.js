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
    "overlap",
    "whyItMatters"
];

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

    overlap: {
        label: "Overlap"
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
                ${patent.universeReviewSelected !== false ? "checked" : ""}
                title="Show in Universe Review"
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

        headerRow.innerHTML += `

            <th
                draggable="true"
                data-column="${column}"
            >
                ${
                    COLUMN_DEFINITIONS[
                        column
                    ].label
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
							COLUMN_RENDERERS[column](
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
