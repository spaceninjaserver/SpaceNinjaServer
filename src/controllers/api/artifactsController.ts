import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";
import { IInventoryClient, IUpgradeClient } from "@/src/types/inventoryTypes/inventoryTypes";
import { addMods, getInventory } from "@/src/services/inventoryService";

export const artifactsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const artifactsData = getJSONfromString<IArtifactsRequest>(String(req.body));

    const { Upgrade, LevelDiff, Cost, FusionPointCost } = artifactsData;

    const inventory = await getInventory(accountId);
    const { Upgrades } = inventory;
    const { ItemType, UpgradeFingerprint, ItemId } = Upgrade;

    const safeUpgradeFingerprint = UpgradeFingerprint || '{"lvl":0}';
    const parsedUpgradeFingerprint = JSON.parse(safeUpgradeFingerprint) as { lvl: number };
    parsedUpgradeFingerprint.lvl += LevelDiff;
    const stringifiedUpgradeFingerprint = JSON.stringify(parsedUpgradeFingerprint);

    let itemIndex = Upgrades.findIndex(upgrade => upgrade._id.equals(ItemId.$oid));

    if (itemIndex !== -1) {
        Upgrades[itemIndex].UpgradeFingerprint = stringifiedUpgradeFingerprint;
    } else {
        itemIndex =
            Upgrades.push({
                UpgradeFingerprint: stringifiedUpgradeFingerprint,
                ItemType
            }) - 1;

        addMods(inventory, [{ ItemType, ItemCount: -1 }]);
    }

    if (!inventory.infiniteCredits) {
        inventory.RegularCredits -= Cost;
    }
    if (!inventory.infiniteEndo) {
        inventory.FusionPoints -= FusionPointCost;
    }

    if (artifactsData.LegendaryFusion) {
        addMods(inventory, [
            {
                ItemType: "/Lotus/Upgrades/Mods/Fusers/LegendaryModFuser",
                ItemCount: -1
            }
        ]);
    }

    const changedInventory = await inventory.save();
    const itemId = changedInventory.toJSON<IInventoryClient>().Upgrades[itemIndex].ItemId.$oid;

    if (!itemId) {
        throw new Error("Item Id not found in upgradeMod");
    }

    res.send(itemId);
};

interface IArtifactsRequest {
    Upgrade: IUpgradeClient;
    LevelDiff: number;
    Cost: number;
    FusionPointCost: number;
    LegendaryFusion?: boolean;
}
