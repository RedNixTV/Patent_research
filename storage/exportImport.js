import {
    getPatents
}
from "./storage.js";

export async function exportData() {

    const patents =
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
					patent.publicationDate
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
            "patent-universe.json"
    });
}