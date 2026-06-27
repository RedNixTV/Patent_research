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

        <label>
		
			Class
		
		</label>
		
		<br>
		
		<select
			id="classificationFamily"
			style="
				width:250px;
				margin-bottom:10px;
			"
		></select>
		
		<br>
		
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

    const classes =
        [];

    const primaryMatch =
        text.match(
            /Primary Class:\s*([^\n]+)/i
        );

    if (primaryMatch) {

        classes.push(
            primaryMatch[1].trim()
        );
    }

    const otherMatch =
        text.match(
            /Other Classes:\s*([^\n]+)/i
        );

    if (otherMatch) {

        classes.push(
            ...otherMatch[1]
                .split(/[;,]/)
                .map(
                    value =>
                        value.trim()
                )
                .filter(Boolean)
        );
    }

    return [
        ...new Set(classes)
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

function getClassificationFamily(
    code
) {

    if (
        /^[A-HY]/.test(
            code
        )
    ) {

        return code.match(
            /^[A-HY]\d{2}[A-Z]\d+/
        )[0];
    }

    return code.split(
        "/"
    )[0];
}

function getCurrentClassificationFamily() {

    const hash =
        decodeURIComponent(
            location.hash
        );

    const cpcMatch =
        hash.match(
            /([A-HY]\d{2}[A-Z]\d+)/
        );

    if (
        cpcMatch
    ) {

        return cpcMatch[1];
    }

    const uspcMatch =
        location.pathname.match(
            /uspc(\d+)/i
        );

    if (
        uspcMatch
    ) {

        return uspcMatch[1];
    }

    return "";
}

async function getAvailableClasses() {

    const patents =
        await getPatents();

    const uspc =
        new Set();

    const cpc =
        new Set();

    for (
        const patent
        of patents
    ) {

        for (
            const code
            of patent.uspc || []
        ) {

            uspc.add(
                getClassificationFamily(
                    code
                )
            );
        }

        for (
            const code
            of patent.cpc || []
        ) {

            cpc.add(
                getClassificationFamily(
                    code
                )
            );
        }
    }

    return {

        uspc:
            [...uspc].sort(),

        cpc:
            [...cpc].sort()
    };
}


async function getClassificationsForFamily(
    family
) {

    const patents =
        await getPatents();

    const classifications =
        new Set();

    for (
        const patent
        of patents
    ) {

        for (
            const code
            of [
                ...(patent.uspc || []),
                ...(patent.cpc || [])
            ]
        ) {

            if (
                getClassificationFamily(
                    code
                ) === family
            ) {

                classifications.add(
                    code
                );
            }
        }
    }

    return [...classifications]
        .sort();
}

async function getFamilyLookupStatus(
    family,
    classifications
) {

    const symbols =
        await getClassificationsForFamily(
            family
        );

    let hasFailure =
        false;

    for (
        const symbol
        of symbols
    ) {

        const record =
            classifications[
                symbol
            ];

        if (
			!record
			||
			record.status ===
				"pending"
		) {
		
			return "pending";
		}

        if (
			record.status ===
			"failed"
		) {
		
			hasFailure = true;
		}
    }

    return hasFailure
        ? "failed"
        : "complete";
}


async function populateClassDropdown() {

    const families =
        await getAvailableClasses();

    const select =
        document.getElementById(
            "classificationFamily"
        );

    select.innerHTML = "";
    
    const storage =
		await chrome.storage.local.get(
			"classifications"
		);
	
	const classifications =
		storage.classifications
		|| {};
		
	let updated = false;
	
	for (
		const record
		of Object.values(
			classifications
		)
	) {
	
		if (
			record.status
		) {
	
			continue;
		}
	
		updated =
			true;
	
		if (
			!record.classTitle
		) {
	
			record.status =
				"pending";
		}
	
		else if (
			record.classTitle ===
				"Classification not found"
			||
			record.classTitle ===
				"Unable to parse title"
		) {
	
			record.status =
				"failed";
		}
	
		else {
	
			record.status =
				"complete";
		}
	}
	
	if (
		updated
	) {
	
		await chrome.storage.local.set({
	
			classifications
		});
	}
    
    const currentFamily = getCurrentClassificationFamily();

    const addGroup =
		async (
			label,
			values
		) => {

        const group =
            document.createElement(
                "optgroup"
            );

        group.label =
            label;

        for (
            const value
            of values
        ) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
				value;
			
			const status =
				await getFamilyLookupStatus(
					value,
					classifications
				);
			
			const icon =
				status === "complete"
			
					? "✓"
			
					: status === "failed"
			
						? "⚠"
			
						: "⏳";
			
			option.textContent =
				`${icon} ${value}`;

            group.appendChild(
                option
            );
        }

        select.appendChild(
            group
        );
    };

    await addGroup(
        "USPC",
        families.uspc
    );

    await addGroup(
        "CPC",
        families.cpc
    );
    
    if (
		currentFamily
	) {
	
		select.value =
			currentFamily;
	}
}


async function populateClassificationTextarea() {

    const family =
        document
            .getElementById(
                "classificationFamily"
            )
            .value;

    const textarea =
        document
            .getElementById(
                "classificationInput"
            );

    if (
        !family
    ) {

        textarea.value = "";

        return;
    }

    const subclasses =
        await getClassificationsForFamily(
            family
        );

    textarea.value =
        subclasses.join(
            "\n"
        );
}

function extractUspcClassTitle(
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

function extractUspcSubclassTitle(
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

function buildUspcDefinitionUrl(
    classNumber
) {

    return `https://www.uspto.gov/web/patents/classification/uspc${classNumber}/defs${classNumber}.htm`;
}

function buildCpcDefinitionUrl(
    symbol
) {

    const section =
        getCpcGrandParent(
            symbol
        );

    if (
        !section
    ) {

        return "";
    }

    return `https://www.uspto.gov/web/patents/classification/cpc/html/cpc-${section}.html`;
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

        const isCpc =
			/^[A-HY]/.test(
				symbol
			);
			
		const [
            classNumber,
            subclassNumber
        ] =
            symbol.split("/");
            
        if (
			isCpc
		) {
		
			let html =
				htmlCache[symbol];
		
			if (
				!html
			) {
		
				const response =
					await fetch(
						buildCpcDefinitionUrl(
							symbol
						)
					);
		
				if (
					!response.ok
				) {
		
					continue;
				}
		
				html =
					await response.text();
		
				htmlCache[
					symbol
				] = html;
			}
		
			const classTitle =
				extractCpcTitle(
					html,
					isCpcParent(
						symbol
					)
			
						? getCpcGrandParent(
							symbol
						  )
			
						: getCpcParent(
							symbol
						  )
				);
		
			const subclassTitle =
				extractCpcTitle(
					html,
					symbol
				);
		
			classifications[symbol] = {
			
				classTitle,
			
				subclassTitle,
				
				artUnit:
					classifications[symbol]?.artUnit
					?? "",
			
				status:
					classTitle === "Classification not found"
					||
					classTitle === "Unable to parse title"
			
						? "failed"
			
						: "complete",
			
				keep:
					classifications[symbol]?.keep
					?? false,
					
				confidence:
					classifications[symbol]?.confidence
					?? "Medium",
				
				researchTier:
					classifications[symbol]?.researchTier
					?? "none",
				
				reason:
					classifications[symbol]?.reason
					?? ""
			};
			
			const parent =
				getCpcParent(
					symbol
				)
					.replace(
						"/00",
						""
					);
			
			if (
				!classifications[parent]
			) {
			
				classifications[parent] = {
				
					classTitle,
				
					subclassTitle: "",
					
					artUnit:
						classifications[parent]?.artUnit
						?? "",
				
					status:
						classTitle === "Classification not found"
						||
						classTitle === "Unable to parse title"
				
							? "failed"
				
							: "complete",
				
					keep:
						classifications[parent]?.keep
						?? false,
					
					confidence:
						classifications[parent]?.confidence
						?? "Medium",
					
					researchTier:
						classifications[parent]?.researchTier
						?? "none",
					
					reason:
						classifications[parent]?.reason
						?? ""
				};
			}
		
			continue;
		}

        let html =
            htmlCache[
                classNumber
            ];

        if (
            !html
        ) {

            const response =
                await fetch(
                    buildUspcDefinitionUrl(
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
                
            const classTitle =
				extractUspcClassTitle(
					html
				) || "";
			
			const subclassTitle =
				extractUspcSubclassTitle(
					html,
					classNumber,
					subclassNumber
				) || "";

			classifications[symbol] = {
		
			classTitle,
		
			subclassTitle,
			
			artUnit:
				classifications[symbol]?.artUnit
				?? "",
		
			status:
				classTitle === "Classification not found"
				||
				classTitle === "Unable to parse title"
		
					? "failed"
		
					: "complete",
		
			keep:
				classifications[symbol]?.keep
				?? false,
				
			confidence:
				classifications[symbol]?.confidence
				?? "Medium",
			
			researchTier:
				classifications[symbol]?.researchTier
				?? "none",
			
			reason:
				classifications[symbol]?.reason
				?? ""
		};
        
        if (
			!classifications[classNumber]
		) {
		
			classifications[classNumber] = {
		
				classTitle,
		
				subclassTitle: "",
				
				artUnit:
					classifications[classNumber]?.artUnit
					?? "",
				
				status:
					classTitle === "Classification not found"
					||
					classTitle === "Unable to parse title"
			
						? "failed"
			
						: "complete",
		
				keep:
					classifications[classNumber]?.keep
					?? false,
				
				confidence:
					classifications[classNumber]?.confidence
					?? "None",
				
				researchTier:
					classifications[classNumber]?.researchTier
					?? "None",
				
				reason:
					classifications[classNumber]?.reason
					?? ""
			};
		}
    }  // <-- closes the for loop

    await chrome.storage.local.set({

        classifications
    });
}

function isCpcParent(
    symbol
) {

    return /\/00$/.test(
        symbol
    );
}

function getCpcGrandParent(
    symbol
) {

    const match =
        symbol.match(
            /^([A-HY]\d{2}[A-Z])/
        );

    return match
        ? match[1]
        : "";
}

function getCpcParent(
    symbol
) {

    const match =
        symbol.match(
            /^([A-HY]\d{2}[A-Z]\d+)/
        );

    return match
        ? `${match[1]}/00`
        : "";
}

function extractCpcTitle(
    html,
    symbol
) {

    const index =
        html.indexOf(
            `id="${symbol}"`
        );

    if (
        index === -1
    ) {

        return "Classification not found";
    }

    const chunk =
        html.slice(
            index,
            index + 5000
        );
        
    console.log(
		chunk.substring(
			0,
			1000
		)
	);
        
    const block =
    chunk.match(
        /<div class="class-title">([\s\S]*?)<span class="date-revised"/i
    );
    
    if (!block) {
	
		return "Unable to parse title";
	}
                
    const matches =
    [
        ...block[1].matchAll(
            /<span class="ipc-text">(.*?)<\/span>/g
        )
    ];
    
    const titles =
		matches.map(
			match =>
				match[1]
					.replace(
						/<[^>]+>/g,
						""
					)
					.replace(
						/\s+/g,
						" "
					)
					.trim()
		);

    return titles.join(
		"; "
	);
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
			
			await populateClassDropdown();
			
			await populateClassificationTextarea();
			
			document
					.getElementById(
						"classificationFamily"
					)
					.onchange =
					populateClassificationTextarea;
			
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

    async (
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

            return;
        }

        if (
            changes.classifications &&
            document.getElementById(
                "classificationFamily"
            )
        ) {

            await populateClassDropdown();

            await populateClassificationTextarea();
        }
    }
);