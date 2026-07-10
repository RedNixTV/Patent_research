import {
    getPatents
}
from "./storage.js";

export async function exportData(
    filename =
        "patent-universe.json",
    patentsToExport =
        null,
    reviewConcepts =
        []
) {

    const patents =
        patentsToExport ||
        await getPatents();

    const exportRows =
		patents.map(
			patent => ({
	
				"Document Number":
					patent.patentNumber,
	
				"Title":
					patent.title,
	
				"Abstract":
					patent.abstract,

                "Claims":
                    patent.claims,

                "Challenge Claims":
                    patent.challengingClaimNumbers,
	
				"Primary Class":
					patent.primaryClass,
	
				"Other Class":
					(
						patent.otherClasses || []
					).join(", "),
	
				"Inventor Name":
					patent.inventorName,
	
				"Assignee":
					patent.assignee,
	
				"Application Number":
					patent.applicationNumber,
	
				"Filing Date":
					patent.filingDate,
	
				"Publication Date":
					patent.publicationDate,

                ...Object.fromEntries(
                    reviewConcepts.map(
                        concept => [
                            concept.label,
                            patent.conceptScores?.[
                                concept.id
                            ] ??
                            (
                                patent.conceptCoverage?.[
                                    concept.id
                                ]
                                    ? "2"
                                    : "0"
                            )
                        ]
                    )
                ),

                "Bullseye Score":
                    getBullseyeScore(
                        patent,
                        reviewConcepts
                    ),

                "Bullseye":
                    getBullseyeLabel(
                        getBullseyeScore(
                            patent,
                            reviewConcepts
                        )
                    )
			})
		);
	
	const blob =
		new Blob(
			[
				JSON.stringify(
					exportRows,
					null,
					2
				)
			]
		);

    const url =
        URL.createObjectURL(
            blob
        );

    chrome.downloads.download({

        url,

        filename:
            filename
    });
}

export function importData(
    text,
    existingPatents = [],
    reviewConcepts = []
) {

    const rows =
        JSON.parse(
            text
        );

    if (!Array.isArray(rows)) {

        throw new Error(
            "Import file must contain a JSON array."
        );
    }

    const existingByPatentNumber =
        new Map(
            existingPatents.map(
                patent => [
                    String(
                        patent.patentNumber ||
                        ""
                    ),
                    patent
                ]
            )
        );

    return rows.map(
        (
            row,
            index
        ) => {

            if (
                !row ||
                typeof row !==
                    "object" ||
                Array.isArray(row)
            ) {

                throw new Error(
                    `Import row ${index + 1} must be an object.`
                );
            }

            const patentNumber =
                String(
                    row[
                        "Document Number"
                    ] ||
                    ""
                ).trim();

            if (!patentNumber) {

                throw new Error(
                    `Import row ${index + 1} is missing Document Number.`
                );
            }

            const existingPatent =
                existingByPatentNumber.get(
                    patentNumber
                ) ||
                {
                    patentNumber
                };

            const patent = {
                ...existingPatent,
                patentNumber
            };

            importField(
                row,
                "Title",
                patent,
                "title"
            );

            importField(
                row,
                "Abstract",
                patent,
                "abstract"
            );

            importField(
                row,
                "Claims",
                patent,
                "claims"
            );

            importField(
                row,
                "Challenge Claims",
                patent,
                "challengingClaimNumbers"
            );

            importField(
                row,
                "Primary Class",
                patent,
                "primaryClass"
            );

            if (
                Object.hasOwn(
                    row,
                    "Other Class"
                )
            ) {

                patent.otherClasses =
                    normalizeOtherClasses(
                        row[
                            "Other Class"
                        ]
                    );
            }

            importField(
                row,
                "Inventor Name",
                patent,
                "inventorName"
            );

            importField(
                row,
                "Assignee",
                patent,
                "assignee"
            );

            importField(
                row,
                "Application Number",
                patent,
                "applicationNumber"
            );

            importField(
                row,
                "Filing Date",
                patent,
                "filingDate"
            );

            importField(
                row,
                "Publication Date",
                patent,
                "publicationDate"
            );

            const conceptScores = {
                ...existingPatent
                    .conceptScores
            };

            for (
                const concept
                of reviewConcepts
            ) {

                if (
                    !Object.hasOwn(
                        row,
                        concept.label
                    )
                ) {

                    continue;
                }

                const score =
                    String(
                        row[
                            concept.label
                        ]
                    ).trim();

                if (
                    !["0", "1", "2"]
                        .includes(score)
                ) {

                    throw new Error(
                        `Import row ${index + 1} has an invalid ${concept.label} score.`
                    );
                }

                conceptScores[
                    concept.id
                ] = score;
            }

            if (
                Object.keys(
                    conceptScores
                ).length
            ) {

                patent.conceptScores =
                    conceptScores;
            }

            return patent;
        }
    );
}

function importField(
    row,
    exportName,
    patent,
    patentField
) {

    if (
        Object.hasOwn(
            row,
            exportName
        )
    ) {

        patent[
            patentField
        ] =
            row[
                exportName
            ] ?? "";
    }
}

function normalizeOtherClasses(
    value
) {

    const values =
        Array.isArray(value)
            ? value
            : String(
                value ||
                ""
              ).split(",");

    return [
        ...new Set(
            values
                .map(
                    className =>
                        String(className)
                            .trim()
                )
                .filter(Boolean)
        )
    ];
}

function getBullseyeScore(
    patent,
    reviewConcepts
) {

    return reviewConcepts.reduce(
        (
            total,
            concept
        ) => {

            const score =
                patent.conceptScores?.[
                    concept.id
                ] ??
                (
                    patent.conceptCoverage?.[
                        concept.id
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

    if (score >= 12) {
        return "Bullseye";
    }

    if (score >= 9) {
        return "Inner Ring";
    }

    if (score >= 6) {
        return "Middle Ring";
    }

    if (score >= 3) {
        return "Outer Ring";
    }

    return "Miss";
}
