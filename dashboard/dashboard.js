import {
    getPatents
}
from "../storage/storage.js";

async function init() {

    const patents =
        await getPatents();

    const tbody =
        document.querySelector(
            "#patentTable tbody"
        );

    for (const patent of patents) {

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>${patent.patentNumber}</td>
            <td>${patent.relevance}</td>
            <td>${patent.title}</td>
        `;

        tbody.appendChild(
            row
        );
    }
}

init();