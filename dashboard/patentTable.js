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
					${patent.patentNumber || "(blank)"}
				</td>

                <td>
                    ${patent.relevance}
                </td>
            `;

            tbody.appendChild(
                row
            );
        }
    );
}