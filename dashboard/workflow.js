export const WORKFLOW_STAGES = [

    {
        id: "landscapeScan",
        title: "Landscape Scan",
        reason: "Collect relevant patents to identify the CPC and USPC classifications that best describe the invention."
    },

    {
        id: "referenceList",
        title: "Reference List",
        reason: "Research each CPC and USPC classification to understand the technology it covers."
    },

    {
        id: "classificationAnalysis",
        title: "Classification Analysis",
       reason:"Determine where the invention belongs or defines it: histogram or technology coverage definition."
    },

    {
        id: "universe",
        title: "Universe",
        reason:"Identify all potentially relevant prior art within the selected classifications."
    },

    {
        id: "universeReview",
        title: "Universe Review",
        reason: "Validate the patent universe by checking coverage, duplicates, and citation relationships."
    },

    {
        id: "finalReferences",
        title: "Final References",
        reason: "Select the strongest prior art references against the invention."
    }
];