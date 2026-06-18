export async function getCurrentProject() {

    const result =
        await chrome.storage.local.get(
            [
                "projects",
                "currentProjectId"
            ]
        );

    const projects =
        result.projects || [];

    return (
		projects.find(
			project =>
				project.id ===
				result.currentProjectId
		)
		||
		projects[0]
	);
}

export async function getProjects() {

    const result =
        await chrome.storage.local.get(
            "projects"
        );

    return result.projects || [];
}

export async function createProject(
    name
) {

    const projects =
        await getProjects();

    const id =
        crypto.randomUUID();

    projects.push({

        id,
        name,

        landscapeScan: []
    });

    await chrome.storage.local.set({

        projects,
        currentProjectId: id
    });

    return id;
}

export async function switchProject(
    projectId
) {

    await chrome.storage.local.set({

        currentProjectId:
            projectId
    });
}

export async function deleteProject(
    projectId
) {

    const projects =
        await getProjects();

    const filtered =
        projects.filter(
            project =>
                project.id !==
                projectId
        );

    if (
        filtered.length === 0
    ) {

        filtered.push({

            id: "default",
            name: "Default Project",

            landscapeScan: []
        });
    }

    await chrome.storage.local.set({

        projects: filtered,

        currentProjectId:
            filtered[0].id
    });
}

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
		
			currentProjectId: "default",
			
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
	
		const defaultProject = {
	
			currentProjectId:
				"default",
	
			projects: [
				{
					id: "default",
					name: "Default Project",
					landscapeScan: []
				}
			]
		};
	
		await chrome.storage.local.set(
			defaultProject
		);
	
		return [];
	}

    const project =
		await getCurrentProject();
	
	return (
		project?.landscapeScan || []
	);
}

async function saveToCurrentProject(
    patents
) {

    const result =
        await chrome.storage.local.get([
            "projects",
            "currentProjectId"
        ]);
        
    const projects = result.projects || [];

    const project =
        projects.find(
            p =>
                p.id ===
                result.currentProjectId
        );

    if (!project) {

        return;
    }

    project.landscapeScan =
        patents;

    await chrome.storage.local.set({
        projects
    });
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

    await saveToCurrentProject(
		patents
	);
}

export async function savePatents(
    patents
) {

    await saveToCurrentProject(
		patents
	);
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

    await saveToCurrentProject(
		patents
	);
}