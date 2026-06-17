export function renderPatentTable(
    patents
) {

    const tbody =
        document.querySelector(
            "#patentTable tbody"
        );

    tbody.innerHTML = "";

    for (
        const patent
        of patents
    ) {

        const row =
            document.createElement(
                "tr"
            );

        row.innerHTML = `
            <td>
				${patent.referenceId}
			</td>
			<td>
                ${patent.patentNumber}
            </td>

            <td>
                ${patent.relevance}
            </td>
        `;

        tbody.appendChild(
            row
        );
    }
}