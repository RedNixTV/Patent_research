console.log(
    "Classification Discovery Tool Loaded"
);


// ====================================
// FPO Extractors
// ====================================

function extractPatentNumber() {

    const match =
        location.pathname.match(
            /\/([^\/]+)\.html$/i
        );

    return match
        ? match[1]
        : "";
}

function extractTitle() {

    const titleElement =
        document.querySelector(
            ".page-header h4"
        );

    if (!titleElement) {

        return "";
    }

    const title =
        titleElement.childNodes[0];

    return title
        ? title.textContent.trim()
        : "";
}
// ====================================
// Patent Builder
// ====================================

function extractPatent() {

    const cpc =
        extractCpc();

    const uspc =
        extractUspc();

    return {

        patentNumber:
            extractPatentNumber(),

        title:
            extractTitle(),

        url:
            location.href,

        abstract:
            extractAbstract(),

        assignee:
            extractAssignee(),
            
        inventorName:
			extractInventorName(),
		
		applicationNumber:
			extractApplicationNumber(),
		
		filingDate:
			extractFilingDate(),
		
		publicationDate:
			extractPublicationDate(),

        imageCount:
            document.images.length,

        cpc,

        primaryCpc: [],

        uspc,
        
        primaryClass:
			uspc?.[0] ||
			"",
		
		otherClasses:
			[
				...uspc.slice(1),
				...cpc.slice(1)
			],

        classifications:
            buildClassifications(
                cpc,
                uspc
            ),

        savedDate:
            new Date()
                .toISOString()
    };
}

function buildClassifications(
    cpc,
    uspc
) {

    const classes = [];

    for (const code of cpc) {

        classes.push({

            type: "CPC",

            code,

            primary: false
        });
    }

    for (const code of uspc) {

        classes.push({

            type: "USPC",

            code
        });
    }

    return classes;
}

// ====================================
// UI
// ====================================

function createLandscapePanel() {

    const panel =
        document.createElement(
            "div"
        );
        
    panel.id = "classificationToolPanel";

    panel.innerHTML = `

        <button id="saveStrong">
            Strong
        </button>

        <button id="savePartial">
            Partial
        </button>

        <button id="saveWeak">
            Weak
        </button>
        <button id="openDashboard">
			Dashboard
		</button>

    `;

    panel.style.position = "fixed";
	panel.style.bottom = "20px";
	panel.style.right = "20px";
	panel.style.zIndex = "999999";
	panel.style.background = "white";
	panel.style.padding = "10px";
	panel.style.border = "1px solid #ccc";
	
	document.body.appendChild(
		panel
	);

    return panel;
}

function createReferenceListPanel() {

    const panel =
        document.createElement(
            "div"
        );
        
    panel.id = "classificationToolPanel";

    panel.innerHTML = `

        <div
            style="
                font-weight:bold;
                margin-bottom:8px;
            "
        >
            Classification Lookup
        </div>

        <textarea
            id="classificationInput"
            style="
                width:250px;
                height:180px;
            "
        ></textarea>

        <br><br>

        <button
            id="lookupClassifications"
        >
            Lookup
        </button>
        
        <button
			id="openDashboard"
			style="
				margin-left:8px;
			"
		>
			Dashboard
		</button>

    `;

    panel.style.position =
        "fixed";

    panel.style.bottom =
        "20px";

    panel.style.right =
        "20px";

    panel.style.zIndex =
        "999999";

    panel.style.background =
        "white";

    panel.style.padding =
        "10px";

    panel.style.border =
        "1px solid #ccc";

    document.body.appendChild(
        panel
    );

    return panel;
}


function extractAbstract() {

    const abstractNode =
        document.querySelector(
            "#abstract_content [p-id]"
        );

    if (abstractNode) {

        return abstractNode.textContent.trim();
    }

    const abstractContainer =
        document.querySelector(
            "#abstract_content"
        );

    return abstractContainer
        ? abstractContainer.innerText.trim()
        : "";
}

function extractAssignee() {

    const text =
        document.body.innerText;

    const match =
        text.match(
            /Assignee:\s*([^\n]+)/i
        );

    return match
        ? match[1].trim()
        : "";
}

function extractInventorName() {

    const text =
        document.body.innerText;

    const match =
        text.match(
            /Inventor[s]?:\s*([^\n]+)/i
        );

    return match
        ? match[1].trim()
        : "";
}

function extractApplicationNumber() {

    const text =
        document.body.innerText;

    const match =
        text.match(
            /App Num:\s*([^\n]+)/i
        );

    return match
        ? match[1].trim()
        : "";
}

function extractFilingDate() {

    const text =
        document.body.innerText;

    const match =
        text.match(
            /File Date:\s*([^\n]+)/i
        );

    return match
        ? match[1].trim()
        : "";
}

function extractPublicationDate() {

    const text =
        document.body.innerText;

    const match =
        text.match(
            /Pub Date:\s*([^\n]+)/i
        );

    return match
        ? match[1].trim()
        : "";
}

function extractCpc() {

    const text =
        document.body.innerText;

    const matches =
        text.match(
            /[A-HY]\d{2}[A-Z]\d+\/\d+/g
        );

    return [
        ...new Set(
            matches || []
        )
    ];
}

function extractUspc() {

    const text =
        document.body.innerText;

    const matches =
        text.match(
            /\d{3}\/\d+/g
        );

    return [
        ...new Set(
            matches || []
        )
    ];
}

// ====================================
// storage
// ====================================
async function savePatent(
    patent
) {

    const result =
        await chrome.storage.local.get([
            "patents",
            "projects",
            "currentProjectId"
        ]);

    const patentLibrary =
        result.patents || {};

    patentLibrary[
        patent.patentNumber
    ] = patent;

    const projects =
        result.projects || [];
        
    if (
		projects.length === 0
	) {
	
		projects.push({
	
			id: "default",
	
			name:
				"Default Project",
				
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
		});
	
		result.currentProjectId =
			"default";
	}

    const project =
        projects.find(
            p =>
                p.id ===
                result.currentProjectId
        );

    if (!project) {

        return;
    }

    if (
        !project.stages
            .landscapeScan
            .includes(
                patent.patentNumber
            )
    ) {

        project.stages
            .landscapeScan
            .push(
                patent.patentNumber
            );
    }

    await chrome.storage.local.set({

        patents:
            patentLibrary,

        projects
    });
}

async function getPatents() {

    const result =
        await chrome.storage.local.get([
            "patents",
            "projects",
            "currentProjectId"
        ]);

    const patentLibrary =
        result.patents || {};

    const currentProject =
        (
            result.projects || []
        ).find(
            project =>
                project.id ===
                result.currentProjectId
        );

    if (!currentProject) {

        return [];
    }

    return (
        currentProject.stages
            .landscapeScan || []
    )
        .map(
            patentNumber =>
                patentLibrary[
                    patentNumber
                ]
        )
        .filter(Boolean);
}

async function deletePatent(
    patentNumber
) {

    const result =
        await chrome.storage.local.get([
            "patents",
            "projects",
            "currentProjectId"
        ]);

    const patentLibrary =
        result.patents || {};

    delete patentLibrary[
        patentNumber
    ];

    const currentProject =
        (
            result.projects || []
        ).find(
            project =>
                project.id ===
                result.currentProjectId
        );

    if (currentProject) {

        currentProject.stages
            .landscapeScan =
            currentProject.stages
                .landscapeScan
                .filter(
                    id =>
                        id !==
                        patentNumber
                );
    }

    await chrome.storage.local.set({

        patents:
            patentLibrary,

        projects:
            result.projects
    });
}

async function getCurrentStage() {

    const result =
        await chrome.storage.local.get([
            "projects",
            "currentProjectId"
        ]);

    const project =
        (
            result.projects || []
        ).find(
            project =>
                project.id ===
                result.currentProjectId
        );

    return (
        project?.workflow
            ?.currentStage
        ||
        "landscapeScan"
    );
}

function extractClassTitle(
    html
) {

    const match =
        html.match(
            /Class Definition for Class \d+\s*-\s*([^<]+)/i
        );

    return match
        ? match[1].trim()
        : "";
}

function extractSubclassTitle(
    html,
    classNumber,
    subclassNumber
) {

    const anchorNumber =
        Math.round(
            Number(
                subclassNumber
            ) * 1000
        )
        .toString()
        .padStart(
            6,
            "0"
        );

    const anchorId =
        `C${classNumber}S${anchorNumber}`;

    const index =
        html.indexOf(
            `name="${anchorId}"`
        );

    if (
        index === -1
    ) {

        return "";
    }

    const chunk =
        html.slice(
            index,
            index + 1000
        );

    const match =
        chunk.match(
            /<b>([^:<]+):<\/b>/i
        );

    const title =
        match
            ? match[1]
            : "";

    return title
        .replace(/\*/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function buildDefinitionUrl(
    classNumber
) {

    return `https://www.uspto.gov/web/patents/classification/uspc${classNumber}/defs${classNumber}.htm`;
}
	
async function lookupClassifications() {

    const symbols =
        document
            .getElementById(
                "classificationInput"
            )
            .value
            .split("\n")
            .map(
                value =>
                    value.trim()
            )
            .filter(Boolean);

    const result =
        await chrome.storage.local.get(
            "classifications"
        );

    const classifications =
        result.classifications
        || {};

    const htmlCache =
        {};

    for (
        const symbol
        of symbols
    ) {

        const [
            classNumber,
            subclassNumber
        ] =
            symbol.split("/");

        let html =
            htmlCache[
                classNumber
            ];

        if (
            !html
        ) {

            const response =
                await fetch(
                    buildDefinitionUrl(
                        classNumber
                    )
                );

            if (
                !response.ok
            ) {

                console.error(
                    `Failed to load class ${classNumber}`
                );

                continue;
            }

            html =
                await response.text();

            htmlCache[
                classNumber
            ] =
                html;
        }

        classifications[
            symbol
        ] = {

            classTitle:
                extractClassTitle(
                    html
                ) || "",

            subclassTitle:
                extractSubclassTitle(
                    html,
                    classNumber,
                    subclassNumber
                ) || "",

            keep:
                classifications[
                    symbol
                ]?.keep
                ?? false
        };
    }

    await chrome.storage.local.set({

        classifications
    });
}

// ====================================
// Main
// ====================================

async function savePatentWithRelevance(
    relevance
) {

    const patent =
			extractPatent();
	
		patent.relevance =
			relevance;
	
		await savePatent(
			patent
		);
	
		alert(
			`${relevance} Saved`
		);
	}
	async function renderPanel() {
	
		const existingPanel =
			document.getElementById(
				"classificationToolPanel"
			);
		
		if (
			existingPanel
		) {
		
			existingPanel.remove();
		}

		const stage =
			await getCurrentStage();
			
		const isClassificationPage =
		location.hostname ===
			"www.uspto.gov"
		&&
		location.pathname.startsWith(
			"/web/patents/classification"
		);
	
		if (
			stage === "referenceList"
			&&
			isClassificationPage
		) {
	
			createReferenceListPanel();
			
			document
			.getElementById(
				"lookupClassifications"
			)
			.onclick =
			lookupClassifications;
			
			document
			.getElementById(
				"openDashboard"
			)
			.onclick =
			() => {
			
				window.open(
					chrome.runtime.getURL(
						"dashboard/dashboard.html"
					),
					"_blank"
				);
			};
	
			return;
		}
	
		createLandscapePanel();
	
		document
			.getElementById(
				"saveStrong"
			)
			.onclick =
			() =>
				savePatentWithRelevance(
					"strong"
				);
	
		document
			.getElementById(
				"savePartial"
			)
			.onclick =
			() =>
				savePatentWithRelevance(
					"partial"
				);
	
		document
			.getElementById(
				"saveWeak"
			)
			.onclick =
			() =>
				savePatentWithRelevance(
					"weak"
				);
	
		document
			.getElementById(
				"openDashboard"
			)
			.onclick =
			() => {
	
				window.open(
					chrome.runtime.getURL(
						"dashboard/dashboard.html"
					),
					"_blank"
				);
			};
	}
	
	renderPanel();
	
	chrome.storage.onChanged.addListener(
	
		(
			changes,
			area
		) => {
	
			if (
				area !== "local"
			) {
	
				return;
			}
	
			if (
				changes.projects
			) {
	
				renderPanel();
			}
		}
	);