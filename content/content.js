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

function createSaveButtons() {

    const panel =
        document.createElement(
            "div"
        );

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

async function getPatents() {

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
					landscapeScan: result.patents
				}
			]
		});
	
		return result.patents;
	}

    return (
		result.projects?.[0]
			?.landscapeScan || []
	);
}

async function savePatent(
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

async function deletePatent(
    patentNumber
) {

    const patents =
        await getPatents();

    const filtered =
        patents.filter(
            patent =>
                patent.patentNumber !==
                patentNumber
        );

    await chrome.storage.local.set({
	
		projects: [
	
			{
				id: "default",
				name: "Default Project",
				landscapeScan: filtered
			}
		]
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

createSaveButtons();

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
    .getElementById("openDashboard")
    .onclick = () => {

        window.open(
			chrome.runtime.getURL(
				"dashboard/dashboard.html"
			),
			"_blank"
		);
    };