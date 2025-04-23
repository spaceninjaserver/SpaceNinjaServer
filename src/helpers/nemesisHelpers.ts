import { ExportRegions } from "warframe-public-export-plus";
import { IInfNode } from "@/src/types/inventoryTypes/inventoryTypes";
import { SRng } from "@/src/services/rngService";
import { TInventoryDatabaseDocument } from "../models/inventoryModels/inventoryModel";
import { logger } from "../utils/logger";
import { IOid } from "../types/commonTypes";
import { Types } from "mongoose";
import { addMods } from "../services/inventoryService";
import { isArchwingMission } from "../services/worldStateService";

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
            !isArchwingMission(value)
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
export const getNemesisPasscode = (nemesis: { fp: bigint; Faction: string }): number[] => {
    const rng = new SRng(nemesis.fp);
    const passcode = [rng.randomInt(0, 7)];
    if (nemesis.Faction != "FC_INFESTATION") {
        passcode.push(rng.randomInt(0, 7));
        passcode.push(rng.randomInt(0, 7));
    }
    return passcode;
};

export const encodeNemesisGuess = (
    symbol1: number,
    result1: number,
    symbol2: number,
    result2: number,
    symbol3: number,
    result3: number
): number => {
    return (
        (symbol1 & 0xf) |
        ((result1 & 3) << 12) |
        ((symbol2 << 4) & 0xff) |
        ((result2 << 14) & 0xffff) |
        ((symbol3 & 0xf) << 8) |
        ((result3 & 3) << 16)
    );
};

export const decodeNemesisGuess = (val: number): number[] => {
    return [val & 0xf, (val >> 12) & 3, (val & 0xff) >> 4, (val & 0xffff) >> 14, (val >> 8) & 0xf, (val >> 16) & 3];
};

export interface IKnifeResponse {
    UpgradeIds?: string[];
    UpgradeTypes?: string[];
    UpgradeFingerprints?: { lvl: number }[];
    UpgradeNew?: boolean[];
    HasKnife?: boolean;
}

export const consumeModCharge = (
    response: IKnifeResponse,
    inventory: TInventoryDatabaseDocument,
    upgrade: { ItemId: IOid; ItemType: string },
    dataknifeUpgrades: string[]
): void => {
    response.UpgradeIds ??= [];
    response.UpgradeTypes ??= [];
    response.UpgradeFingerprints ??= [];
    response.UpgradeNew ??= [];
    response.HasKnife = true;

    if (upgrade.ItemId.$oid != "000000000000000000000000") {
        const dbUpgrade = inventory.Upgrades.id(upgrade.ItemId.$oid)!;
        const fingerprint = JSON.parse(dbUpgrade.UpgradeFingerprint!) as { lvl: number };
        fingerprint.lvl += 1;
        dbUpgrade.UpgradeFingerprint = JSON.stringify(fingerprint);

        response.UpgradeIds.push(upgrade.ItemId.$oid);
        response.UpgradeTypes.push(upgrade.ItemType);
        response.UpgradeFingerprints.push(fingerprint);
        response.UpgradeNew.push(false);
    } else {
        const id = new Types.ObjectId();
        inventory.Upgrades.push({
            _id: id,
            ItemType: upgrade.ItemType,
            UpgradeFingerprint: `{"lvl":1}`
        });

        addMods(inventory, [
            {
                ItemType: upgrade.ItemType,
                ItemCount: -1
            }
        ]);

        const dataknifeRawUpgradeIndex = dataknifeUpgrades.indexOf(upgrade.ItemType);
        if (dataknifeRawUpgradeIndex != -1) {
            dataknifeUpgrades[dataknifeRawUpgradeIndex] = id.toString();
        } else {
            logger.warn(`${upgrade.ItemType} not found in dataknife config`);
        }

        response.UpgradeIds.push(id.toString());
        response.UpgradeTypes.push(upgrade.ItemType);
        response.UpgradeFingerprints.push({ lvl: 1 });
        response.UpgradeNew.push(true);
    }
};
