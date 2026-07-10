export function createPatent() {

   return {
	
		patentNumber: "",
		title: "",
		url: "",
		relevance: "",
		overlap: "None",
		whyItMatters: "",
		universeReviewSelected: false,
		finalReferenceSelected: false,
		finalReferenceComment: "",
		finalReferenceReason: "",
		finalReferencePriorityPoints: 0,
	
		abstract: "",
		claims: "",
		challengingClaimNumbers: "",
		conceptCoverage: {},
		conceptScores: {},
	
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
        
        artUnit: "",

        artUnitReason: "",

        pickArtUnit: false,

        employee: "",
		
		phone: "",
		
		comment: "",

        status: "pending",

        keep: false,
        
        confidence: "None",
		
		researchTier: "None",
		
		reason: ""
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
                notes: "",
                concepts: []
            },

            finalReferences: []
        }
    };
}
