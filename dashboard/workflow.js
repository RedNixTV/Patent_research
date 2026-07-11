export const WORKFLOW_STAGES = [
    {
        id: "landscapeScan",
        title: "Landscape Scan",
        reason: "Quickly review titles, images, and abstracts. \n The objective is to understand where related inventions exist, not to find the exact invention immediately. \n Collect relevant patents to identify the CPC and USPC classifications that best describe the invention. Include: Strong, Weak, Partial matches, and Any overlapping feature. Avoid filtering too aggressively at this stage. Result Size Target: 100 to 300.",
    },

    {
        id: "referenceList",
        title: "Reference List",
        reason: "Research each CPC and USPC classification to understand the technology it covers. Ignore Noise Classes such as i.	“Class 1/1” ",
    },

    {
        id: "classificationAnalysis",
        title: "Classification Analysis",
        reason: "The most common classes usually indicate where the invention belongs. \n Determine where the invention belongs. Identify Top Classes to search (Your Targets 2-4 strong classes). \n Validate those classes using 'i.	https://www.uspto.gov/web/patents/classification/' USPTO classification resources before relying on them. Before searching it, check: What does this class cover and Does it match your invention? ",
    },
    {
        id: "artUnit",
        title: "Art Unit",
        reason: "Determine the appropriate Art Unit from the classifications. \n Find art unit: https://www.uspto.gov/sites/default/files/documents/caau.pdf 'Class 705/400: Art unit 3628'",
    },

    {
        id: "examinerValidation",
        title: "Examiner Validation",
        reason: "Identify examiners assigned to that Art Unit. \n Contact examiners only for classification guidance, not for a prior art search. \n Find the USPTO examiner: 'https://portal.uspto.gov/EmployeeSearch/' Enter organization 3771 and then search",
    },

    {
        id: "universe",
        title: "Universe",
        reason: "Shift to class-based search: Search by class then refine with keywords.  Assemble a broad collection of potentially relevant patents. Continue adding references until every important feature is represented. Monitor which features are overrepresented and which still need coverage.",
    },

    {
        id: "universeReview",
        title: "Universe Review",
        reason: "Compare each patent against the invention feature by feature. If important features are missing, return to searching. Validate the patent universe by checking coverage, duplicates, and citation relationships.",
    },

    {
        id: "finalReferences",
        title: "Final References",
        reason: "Select the strongest prior art references against the invention. Narrow the universe to approximately 15 to 20 best prior art examples. Select references that collectively represent: Different structures, implementations, and combinations of features. Choose roughly 5 to 6 key references for detailed discussion.",
    },

    {
        id: "citationResearch",
        title: "Citation Research",
        reason: "Research the patents that cite each selected high-value prior-art reference and the earlier patents cited by that reference. Review both forward and backward citations to identify related implementations, patent families, improvements, and stronger prior art.",
    },
];
