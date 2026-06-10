export const buildVersionToInt = (buildVersion: string): number => {
    const [year, month, day, hour, minute] = buildVersion.split(".").map(x => parseInt(x));
    return year * 1_00_00_00_00 + month * 1_00_00_00 + day * 1_00_00 + hour * 1_00 + minute;
};

export const buildLabelToVersionInt = (buildLabel: string): number => {
    return buildVersionToInt(buildLabel.split("/")[0]);
};
