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
    "relevance"
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
        patent =>
            truncate(
                patent.title,
                60
            ),

    abstract:
        patent =>
            truncate(
                patent.abstract,
                120
            ),

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
        patent =>
            patent.relevance || ""
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
    columnOrder
) {

    const headerRow =
        document.getElementById(
            "headerRow"
        );

    headerRow.innerHTML = "";

    headerRow.innerHTML =
        "<th>#</th>";

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
    columnOrder
){

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

            let html = `
			
				<td>
			
					<span
						class="editPatent"
						data-index="${
							patent.originalIndex ??
							index
						}"
						title="Edit Patent"
						style="
							cursor:pointer;
							margin-right:8px;
						"
					>
						✏️
					</span>
			
					${patent.referenceId}
			
				</td>
			`;
			
			for (
					const column
					of columnOrder
				) {
				
					const value =
						COLUMN_RENDERERS[
							column
						](
							patent
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