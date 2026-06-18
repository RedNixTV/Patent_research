export async function getPatents() {

    const result =
		await chrome.storage.local.get(
			["patents", "projects"]
		);
	
	if (
		!result.projects &&
		result.patents
	) {
	
		await chrome.storage.local.set({
	
			projects: [
				{
					id: "default",
					name: "Default Project",
					landscapeScan:
						result.patents
				}
			]
		});
	
		return result.patents;
	}

    if (
        !result.projects ||
        result.projects.length === 0
    ) {

        return [];
    }

    return (
        result.projects[0]
            .landscapeScan || []
    );
}

export async function savePatent(
    patent
) {

    const patents =
        await getPatents();

    const existing =
        patents.findIndex(
            p =>
                p.patentNumber ===
                patent.patentNumber
        );

    if (existing >= 0) {

        patents[existing] = patent;
    }
    else {

        patents.push(patent);
    }

    await chrome.storage.local.set({

        projects: [

            {
                id: "default",
                name: "Default Project",
                landscapeScan: patents
            }
        ]
    });
}

export async function savePatents(
    patents
) {

    await chrome.storage.local.set({

        projects: [

            {
                id: "default",
                name: "Default Project",
                landscapeScan: patents
            }
        ]
    });
}

export async function deletePatentByIndex(
    index
) {

    const patents =
        await getPatents();

    patents.splice(
        index,
        1
    );

    await chrome.storage.local.set({
        projects: [
			{
				id: "default",
				name: "Default Project",
				landscapeScan: patents
			}
		]
    });
}