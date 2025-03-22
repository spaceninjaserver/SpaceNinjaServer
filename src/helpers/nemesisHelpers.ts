import { ExportRegions } from "warframe-public-export-plus";
import { IInfNode } from "@/src/types/inventoryTypes/inventoryTypes";
import { SRng } from "@/src/services/rngService";

export const getInfNodes = (faction: string, rank: number): IInfNode[] => {
    const infNodes = [];
    const systemIndex = systemIndexes[faction][rank];
    for (const [key, value] of Object.entries(ExportRegions)) {
        if (
            value.systemIndex === systemIndex &&
            value.nodeType != 3 && // not hub
            value.nodeType != 7 && // not junction
            value.missionIndex && // must have a mission type and not assassination
            value.missionIndex != 28 && // not open world
            value.missionIndex != 32 && // not railjack
            value.missionIndex != 41 && // not saya's visions
            value.missionIndex != 42 && // not face off
            value.name.indexOf("1999NodeI") == -1 && // not stage defence
            value.name.indexOf("1999NodeJ") == -1 && // not lich bounty
            value.name.indexOf("Archwing") == -1
        ) {
            //console.log(dict_en[value.name]);
            infNodes.push({ Node: key, Influence: 1 });
        }
    }
    return infNodes;
};

const systemIndexes: Record<string, number[]> = {
    FC_GRINEER: [2, 3, 9, 11, 18],
    FC_CORPUS: [1, 15, 4, 7, 8],
    FC_INFESTATION: [23]
};

// Get a parazon 'passcode' based on the nemesis fingerprint so it's always the same for the same nemesis.
export const getNemesisPasscode = (fp: bigint, faction: string): number[] => {
    const rng = new SRng(fp);
    const passcode = [rng.randomInt(0, 7)];
    if (faction != "FC_INFESTATION") {
        passcode.push(rng.randomInt(0, 7));
        passcode.push(rng.randomInt(0, 7));
    }
    return passcode;
};
