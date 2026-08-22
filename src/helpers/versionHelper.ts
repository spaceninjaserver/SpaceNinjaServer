export const buildVersionToInt = (buildVersion: string): number => {
    const [year, month, day, hour, minute] = buildVersion.split(".").map(x => parseInt(x));
    return year * 1_00_00_00_00 + month * 1_00_00_00 + day * 1_00_00 + hour * 1_00 + minute;
};

export const buildLabelToVersionInt = (buildLabel: string): number => {
    return buildVersionToInt(buildLabel.split("/")[0]);
};

export const intToBuildVersion = (versionInt: number): string => {
    const year = Math.floor(versionInt / 1_00_00_00_00);
    const month = Math.floor(versionInt / 1_00_00_00) % 100;
    const day = Math.floor(versionInt / 1_00_00) % 100;
    const hour = Math.floor(versionInt / 1_00) % 100;
    const minute = versionInt % 100;

    return `${year}.${month.toString().padStart(2, "0")}.${day.toString().padStart(2, "0")}.${hour.toString().padStart(2, "0")}.${minute.toString().padStart(2, "0")}`;
};

export const wikiDateToBuildVersion = (wikiDate: number): string => {
    const date = new Date(wikiDate * 1000);
    return `${date.getUTCFullYear()}.${date.getUTCMonth()}.${date.getUTCDate()}.${date.getUTCHours()}.${date.getUTCMinutes()}`;
};

export const wikiDateToBuildVersionInt = (wikiDate: number): number => {
    return buildVersionToInt(wikiDateToBuildVersion(wikiDate));
};
