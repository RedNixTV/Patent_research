import {
    getPatents
}
from "../storage/storage.js";

import {
    buildHistogramWithReferences,
    buildSubclassHistogramWithReferences
}
from "./histogram.js";

import {
    renderPatentTable
}
from "./patentTable.js";

let patents = [];
let currentView =
    "references";

async function init() {

    patents =
        await getPatents();
        
    patents.forEach(
		(
			patent,
			index
		) => {
	
			patent.referenceId =
				index + 1;
		}
	);

    renderPatentTable(
        patents
    );

    document
		.getElementById(
			"cpcTab"
		)
		.onclick =
		() => {
	
			currentView =
				"cpc";
	
			renderCpcHistogram();
		};

    document
		.getElementById(
			"uspcTab"
		)
		.onclick =
		() => {
	
			currentView =
				"uspc";
	
			renderUspcHistogram();
		};

    document
		.getElementById(
			"referencesTab"
		)
		.onclick =
		() => {
	
			currentView =
				"references";
	
			showReferences();
		};
		
	document
		.getElementById(
			"showFullClasses"
		)
		.addEventListener(
			"change",
			updateCurrentHistogram
		);
}

function updateCurrentHistogram() {

    if (
        currentView ===
        "cpc"
    ) {

        renderCpcHistogram();
    }

    else if (
        currentView ===
        "uspc"
    ) {

        renderUspcHistogram();
    }
}

function showReferences() {

    document
        .getElementById(
            "histogramOutput"
        )
        .textContent = "";
}

function renderCpcHistogram() {

    const showFull =
        document
            .getElementById(
                "showFullClasses"
            )
            .checked;

    const histogram =
		showFull
			? buildHistogramWithReferences(
				patents,
				"allCpc"
			)
			: buildSubclassHistogramWithReferences(
				patents,
				"cpc"
			);

    renderHistogram(
        histogram,
        showFull
            ? "Top CPC Classes"
            : "Top CPC Subclasses"
    );
}

function renderUspcHistogram() {

    const showFull =
        document
            .getElementById(
                "showFullClasses"
            )
            .checked;

    const histogram =
		showFull
			? buildHistogramWithReferences(
				patents,
				"uspc"
			)
			: buildSubclassHistogramWithReferences(
				patents,
				"uspc"
			);

    renderHistogram(
        histogram,
        showFull
            ? "Top USPC Classes"
            : "Top USPC Main Classes"
    );
}

function renderHistogram(
    histogram,
    title
) {

    const sorted =
    Object.entries(
        histogram
    )
    .sort(
        (a,b) =>
            b[1].count -
            a[1].count
    );

    let output =
        `${title}\n\n`;

    for (
			const [
				code,
				data
			]
			of sorted
		) {

        const refs =
				data.references
					.sort(
						(a,b) =>
							a - b
					)
					.join(",");
			
			output +=
				`${code.padEnd(
					20,
					"."
				)} ${data.count} [${refs}]\n`;
    }

    document
        .getElementById(
            "histogramOutput"
        )
        .textContent =
        output;
}

init();