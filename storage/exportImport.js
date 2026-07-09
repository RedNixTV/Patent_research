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
