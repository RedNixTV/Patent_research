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

export function getCpcSubclass(
    code
) {

    const match =
        code.match(
            /^([A-HY]\d{2}[A-Z]\d+)/
        );

    return match
        ? match[1]
        : code;
}

export function getClassificationFamily(
    code
) {

    const match =
        code.match(
            /^([A-HY]\d{2}[A-Z]\d+)/
        );

    if (match) {

        return match[1];
    }

    return code.split(
        "/"
    )[0];
}

export function buildFamilyTotals(
    histogram
) {

    const totals = {};

    for (
        const [
            code,
            data
        ]
        of Object.entries(
            histogram
        )
    ) {

        const family =
            getClassificationFamily(
                code
            );

        totals[family] =
            (
                totals[family] || 0
            ) + data.count;
    }

    return totals;
}

export function buildSubclassHistogram(
    patents,
    mode
) {

    const histogram = {};

    for (const patent of patents) {

        const classes =
            mode === "cpc"
                ? patent.cpc || []
                : patent.uspc || [];

        for (const code of classes) {

            const bucket =
                mode === "cpc"
                    ? getCpcSubclass(
                        code
                    )
                    : code.split(
                        "/"
                    )[0];

            histogram[bucket] =
                (
                    histogram[
                        bucket
                    ] || 0
                ) + 1;
        }
    }

    return histogram;
}

export function buildOtherUspcHistogramWithReferences(
    patents
) {

    const histogram = {};

    for (
        const patent
        of patents
    ) {

        const others =
				(patent.uspc || [])
					.slice(1);

        for (
            const code
            of others
        ) {

            histogram[code] ??= {

                count: 0,

                references: []
            };

            histogram[
                code
            ].count++;

            histogram[
                code
            ].references.push(
                patent.referenceId
            );
        }
    }

    return histogram;
}

export function buildOtherUspcSubclassHistogramWithReferences(
    patents
) {

    const histogram = {};

    for (
        const patent
        of patents
    ) {

        for (
            const code
            of (patent.uspc || []).slice(1)
        ) {

            const bucket =
                code.split("/")[0];

            histogram[bucket] ??= {

                count: 0,

                references: []
            };

            histogram[
                bucket
            ].count++;

            if (
                !histogram[
                    bucket
                ].references.includes(
                    patent.referenceId
                )
            ) {

                histogram[
                    bucket
                ].references.push(
                    patent.referenceId
                );
            }
        }
    }

    return histogram;
}

export function buildPrimaryUspcHistogramWithReferences(
    patents
) {

    const histogram = {};

    for (
        const patent
        of patents
    ) {

        const code =
            patent.primaryClass;

        if (
            !code
        ) {

            continue;
        }

        histogram[code] ??= {

            count: 0,

            references: []
        };

        histogram[
            code
        ].count++;

        histogram[
            code
        ].references.push(
            patent.referenceId
        );
    }

    return histogram;
}

export function buildPrimaryUspcSubclassHistogramWithReferences(
    patents
) {

    const histogram = {};

    for (
        const patent
        of patents
    ) {

        const code =
            patent.primaryClass;

        if (
            !code
        ) {

            continue;
        }

        const bucket =
            code.split(
                "/"
            )[0];

        histogram[bucket] ??= {

            count: 0,

            references: []
        };

        histogram[
            bucket
        ].count++;

        if (
            !histogram[
                bucket
            ].references.includes(
                patent.referenceId
            )
        ) {

            histogram[
                bucket
            ].references.push(
                patent.referenceId
            );
        }
    }

    return histogram;
}

export function buildHistogramWithReferences(
    patents,
    mode
) {

    const histogram = {};

    for (
        const patent
        of patents
    ) {

        let classes = [];

        if (
            mode === "allCpc"
        ) {

            classes =
                patent.cpc || [];
        }

        else if (
            mode === "primaryCpc"
        ) {

            classes =
                patent.primaryCpc || [];
        }

        else if (
            mode === "uspc"
        ) {

            classes =
                patent.uspc || [];
        }

        for (
            const code
            of classes
        ) {

            histogram[code] ??= {

                count: 0,

                references: []
            };

            histogram[code].count++;

            histogram[
                code
            ].references.push(
                patent.referenceId
            );
        }
    }

    return histogram;
}

export function buildSubclassHistogramWithReferences(
    patents,
    mode
) {

    const histogram = {};

    for (
        const patent
        of patents
    ) {

        const classes =
            mode === "cpc"
                ? patent.cpc || []
                : patent.uspc || [];

        for (
            const code
            of classes
        ) {

            const bucket =
                mode === "cpc"
                    ? getCpcSubclass(
                        code
                    )
                    : code.split(
                        "/"
                    )[0];

            histogram[bucket] ??= {

                count: 0,

                references: []
            };

            histogram[
                bucket
            ].count++;

            if (
                !histogram[
                    bucket
                ].references.includes(
                    patent.referenceId
                )
            ) {

                histogram[
                    bucket
                ].references.push(
                    patent.referenceId
                );
            }
        }
    }

    return histogram;
}