export async function getPatentById(
    patentNumber
) {

    const library =
        await getPatentLibrary();

    return library[
        patentNumber
    ];
}

export async function getPatentLibrary() {

    const result =
        await chrome.storage.local.get(
            "patents"
        );

    return result.patents || {};
}

export async function savePatentLibrary(
    patents
) {

    await chrome.storage.local.set({
        patents
    });
}

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
	
		stages: {
	
			landscapeScan: [],
	
			referenceList: [],
	
			classificationAnalysis: {
	
				selectedClasses: [],
				selectedSubclasses: []
			},
	
			universe: [],
	
			universeReview: {
	
				excludedPatentIds: [],
				notes: ""
			},
	
			finalReferences: []
		}
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

        filtered.push(
        	{
				id: "default",
				name: "Default Project",
			
				stages: {
			
					landscapeScan: [],
			
					referenceList: [],
			
					classificationAnalysis: {
			
						selectedClasses: [],
						selectedSubclasses: []
					},
			
					universe: [],
			
					universeReview: {
			
						excludedPatentIds: [],
						notes: ""
					},
			
					finalReferences: []
				}
			}
        );
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

    // Legacy migration:
    // patents: []
    // ->
    // projects + patent library

    if (
        !result.projects &&
        result.patents
    ) {

        const patentLibrary = {};

        for (
            const patent
            of result.patents
        ) {

            patentLibrary[
                patent.patentNumber
            ] = patent;
        }

        await chrome.storage.local.set({

            currentProjectId:
                "default",

            projects: [
                {
                    id: "default",
                    name: "Default Project",

                    stages: {

                        landscapeScan:
                            result.patents,

                        referenceList: [],

                        classificationAnalysis: {

                            selectedClasses: [],
                            selectedSubclasses: []
                        },

                        universe: [],

                        universeReview: {

                            excludedPatentIds: [],
                            notes: ""
                        },

                        finalReferences: []
                    }
                }
            ],

            patents:
                patentLibrary
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

                    stages: {

                        landscapeScan: [],

                        referenceList: [],

                        classificationAnalysis: {

                            selectedClasses: [],
                            selectedSubclasses: []
                        },

                        universe: [],

                        universeReview: {

                            excludedPatentIds: [],
                            notes: ""
                        },

                        finalReferences: []
                    }
                }
            ],

            patents: {}
        };

        await chrome.storage.local.set(
            defaultProject
        );

        return [];
    }

    const project =
        await getCurrentProject();

    if (
        project &&
        !project.stages
    ) {

        project.stages = {

            landscapeScan:
                project.landscapeScan || [],

            referenceList: [],

            classificationAnalysis: {

                selectedClasses: [],
                selectedSubclasses: []
            },

            universe: [],

            universeReview: {

                excludedPatentIds: [],
                notes: ""
            },

            finalReferences: []
        };

        delete project.landscapeScan;

        const storage =
            await chrome.storage.local.get(
                "projects"
            );

        await chrome.storage.local.set({

            projects:
                storage.projects
        });
    }

    return (
        project?.stages
            ?.landscapeScan || []
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

   project.stages.landscapeScan =
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
	
	const library =
		await getPatentLibrary();
	
	library[
		patent.patentNumber
	] = patent;
	
	await savePatentLibrary(
		library
	);
}

export async function savePatents(
    patents
) {

    await saveToCurrentProject(
		patents
	);
	
	const library =
		await getPatentLibrary();
	
	for (
		const patent
		of patents
	) {
	
		library[
			patent.patentNumber
		] = patent;
	}
	
	await savePatentLibrary(
		library
	);
}

export async function deletePatentByIndex(
    index
) {

    const patents =
        await getPatents();

    const removedPatent =
    patents[index];
    
    patents.splice(
        index,
        1
    );

    await saveToCurrentProject(
		patents
	);
	
	const library =
		await getPatentLibrary();
	
	delete library[
		removedPatent.patentNumber
	];
	
	await savePatentLibrary(
		library
	);
}