import {
    getPatents
}
from "./storage.js";

export async function exportData() {

    const patents =
        await getPatents();

    const blob =
        new Blob(
            [
                JSON.stringify(
                    patents,
                    null,
                    2
                )
            ]
        );

    const url =
        URL.createObjectURL(
            blob
        );

    chrome.downloads.download({

        url,

        filename:
            "patent-universe.json"
    });
}