import { ISyndicate } from "warframe-public-export-plus";

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
