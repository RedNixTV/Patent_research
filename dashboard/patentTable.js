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

export function renderPatentTable(
    patents
) {

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

            row.innerHTML = `
					<td>
				
						<span
							class="editPatent"
							data-index="${index}"
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
				
					<td>
						${patent.patentNumber || ""}
					</td>
				
					<td title="${patent.title || ""}">
						${truncate(
							patent.title,
							60
						)}
					</td>
					
					<td title="${patent.abstract || ""}">
						${truncate(
							patent.abstract,
							120
						)}
					</td>
				
					<td>
						${patent.inventorName || ""}
					</td>
				
					<td>
						${patent.assignee || ""}
					</td>
				
					<td>
						${patent.applicationNumber || ""}
					</td>
				
					<td>
						${patent.filingDate || ""}
					</td>
				
					<td>
						${patent.publicationDate || ""}
					</td>
				
					<td>
						${patent.primaryClass || ""}
					</td>
				
					<td
						title="${(patent.otherClasses || []).join(", ")}"
					>
						${(patent.otherClasses || [])
							.slice(0, 3)
							.join(", ")}
						${(patent.otherClasses || []).length > 3
							? "..."
							: ""}
					</td>
				
					<td>
						${patent.relevance || ""}
					</td>
				`;

            tbody.appendChild(
                row
            );
        }
    );
}