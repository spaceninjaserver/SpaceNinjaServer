import type { ISyndicate } from "warframe-public-export-plus";

export const getMaxStanding = (syndicate: ISyndicate, title: number): number => {
    if (!syndicate.titles) {
        // LibrarySyndicate
        return 125000;
    }
    if (title == 0) {
        return syndicate.titles.find(x => x.level == 1)!.minStanding;
    }
    return syndicate.titles.find(x => x.level == title)!.maxStanding;
};

export const getMinStanding = (syndicate: ISyndicate, title: number): number => {
    if (!syndicate.titles) {
        // LibrarySyndicate
        return 0;
    }
    if (title == 0) {
        return syndicate.titles.find(x => x.level == -1)?.maxStanding ?? 0;
    }
    return syndicate.titles.find(x => x.level == title)!.minStanding;
};

export const getTitleBounds = (
    syndicate: ISyndicate,
    title: number
): { min: number; max: number; base: number } | undefined => {
    if (syndicate.titles && !syndicate.titles.some(x => x.level == (title == 0 ? 1 : title))) {
        return undefined;
    }
    const min = getMinStanding(syndicate, title);
    const max = getMaxStanding(syndicate, title);
    return { min, max, base: title > 0 ? min : title < 0 ? max : 0 };
};
