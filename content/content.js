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

    const h1 =
        document.querySelector(
            "h1"
        );

    return h1
        ? h1.textContent.trim()
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

        imageCount:
            document.images.length,

        cpc,

        primaryCpc: [],

        uspc,

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
            "#abstract"
        );

    return abstractNode
        ? abstractNode.textContent.trim()
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
            "patents"
        );

    return result.patents || [];
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
        patents
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
        patents: filtered
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