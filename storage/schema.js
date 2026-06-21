export function createPatent() {

   return {
	
		patentNumber: "",
		title: "",
		url: "",
		relevance: "",
	
		abstract: "",
	
		inventorName: "",
		assignee: "",
	
		applicationNumber: "",
		filingDate: "",
		publicationDate: "",
	
		primaryClass: "",
		otherClasses: [],
	
		imageCount: 0,
	
		cpc: [],
		primaryCpc: [],
		uspc: [],
		
		savedDate: ""
	};
}

export function createClassification() {

    return {

        classTitle: "",

        subclassTitle: "",

        keep: false
    };
}

export function createStorageSchema() {

    return {

        currentProjectId: "",

        projects: [],

        patents: {},

        classifications: {}
    };
}

export function createProject(
    id,
    name
) {

    return {

        id,
        name,
        
        workflow: {
		
			currentStage:
				"landscapeScan"
		},

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
    };
}