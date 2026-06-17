export function buildHistogram(
    patents,
    mode
) {

    const histogram = {};

    for (const patent of patents) {

        let classes = [];

        if (mode === "allCpc") {

            classes =
                patent.cpc;
        }

        else if (
            mode === "primaryCpc"
        ) {

            classes =
                patent.primaryCpc;
        }

        else if (
            mode === "uspc"
        ) {

            classes =
                patent.uspc;
        }

        for (
            const code
            of classes
        ) {

            histogram[code] =
                (histogram[code] || 0) + 1;
        }
    }

    return histogram;
}