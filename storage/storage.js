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
        
    if (
			Array.isArray(
				result.patents
			)
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
		
				patents:
					patentLibrary
			});
		
			result.patents =
				patentLibrary;
		}


    if (
        !result.projects &&
        result.patents
    ) {
		const patentLibrary = result.patents;
		
        await chrome.storage.local.set({

            currentProjectId:
                "default",

            projects: [
                {
                    id: "default",
                    name: "Default Project",

                    stages: {

                        landscapeScan:
                            Object.values(
													result.patents
												).map(
															patent =>
																patent.patentNumber
														),

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

        return Object.values(
			result.patents
		);
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

    let currentProject =
		await getCurrentProject();
		
	 if (
			currentProject &&
			!currentProject.stages
		) {
		
			const projects =
				result.projects;
		
			const projectIndex =
				projects.findIndex(
					p => p.id === currentProject.id
				);
		
			if (projectIndex >= 0) {
		
				projects[
					projectIndex
				].stages = {
		
					landscapeScan:
						projects[
							projectIndex
						].landscapeScan || [],
		
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
		
				delete projects[
					projectIndex
				].landscapeScan;
		
				await chrome.storage.local.set({
					projects
				});
		
				result.projects =
					projects;
			}
		}
	
	if (
		currentProject?.stages?.landscapeScan?.length &&
		typeof currentProject.stages
			.landscapeScan[0] ===
			"object"
	) {
	
		const projects =
			result.projects;
	
		const projectIndex =
			projects.findIndex(
				p => p.id === currentProject.id
			);
	
		if (projectIndex >= 0) {
	
			projects[
				projectIndex
			].stages.landscapeScan =
				projects[
					projectIndex
				].stages.landscapeScan.map(
					patent =>
						patent.patentNumber
				);
	
			await chrome.storage.local.set({
				projects
			});
			
			result.projects = projects;
		}
	}
	
	currentProject =
    await getCurrentProject();

    const patentLibrary =
		result.patents || {};
	
	return (
		currentProject?.stages
			?.landscapeScan || []
	).map(
		patentNumber =>
			patentLibrary[
				patentNumber
			]
	).filter(Boolean);
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
    patents.map(
        patent =>
            patent.patentNumber
    );

    await chrome.storage.local.set({
        projects
    });
}

export async function savePatent(
    patent
) {

    const library =
        await getPatentLibrary();

    library[
        patent.patentNumber
    ] = patent;

    await savePatentLibrary(
        library
    );

    const project =
        await getCurrentProject();

    if (
        !project.stages
            .landscapeScan.includes(
                patent.patentNumber
            )
    ) {

        project.stages
            .landscapeScan
            .push(
                patent.patentNumber
            );
    }

    const projects =
        await getProjects();

    await chrome.storage.local.set({
        projects
    });
}

export async function savePatents(
    patents
) {

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
	
    await saveToCurrentProject(
		patents
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