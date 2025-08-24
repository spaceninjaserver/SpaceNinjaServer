import { toOid } from "@/src/helpers/inventoryHelpers";
import {
    createVeiledRivenFingerprint,
    createUnveiledRivenFingerprint,
    rivenRawToRealWeighted
} from "@/src/helpers/rivenHelper";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { addMods, getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getRandomElement } from "@/src/services/rngService";
import { RequestHandler } from "express";
import { ExportUpgrades } from "warframe-public-export-plus";

export const activateRandomModController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "RawUpgrades Upgrades instantFinishRivenChallenge");
    const request = getJSONfromString<IActiveRandomModRequest>(String(req.body));
    addMods(inventory, [
        {
            ItemType: request.ItemType,
            ItemCount: -1
        }
    ]);
    const rivenType = getRandomElement(rivenRawToRealWeighted[request.ItemType])!;
    const fingerprint = inventory.instantFinishRivenChallenge
        ? createUnveiledRivenFingerprint(ExportUpgrades[rivenType])
        : createVeiledRivenFingerprint(ExportUpgrades[rivenType]);
    const upgradeIndex =
        inventory.Upgrades.push({
            ItemType: rivenType,
            UpgradeFingerprint: JSON.stringify(fingerprint)
        }) - 1;
    await inventory.save();
    // For some reason, in this response, the UpgradeFingerprint is simply a nested object and not a string
    res.json({
        NewMod: {
            UpgradeFingerprint: fingerprint,
            ItemType: rivenType,
            ItemId: toOid(inventory.Upgrades[upgradeIndex]._id)
        }
    });
};

interface IActiveRandomModRequest {
    ItemType: string;
}
