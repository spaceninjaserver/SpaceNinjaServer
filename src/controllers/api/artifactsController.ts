import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";
import { ICrewShipSalvagedWeaponSkin } from "@/src/types/inventoryTypes/inventoryTypes";
import { addMods, getInventory } from "@/src/services/inventoryService";
import { config } from "@/src/services/configService";

export const artifactsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const artifactsData = getJSONfromString(String(req.body)) as IArtifactsRequest;

    const { Upgrade, LevelDiff, Cost, FusionPointCost } = artifactsData;

    const inventory = await getInventory(accountId);
    const { Upgrades, RawUpgrades } = inventory;
    const { ItemType, UpgradeFingerprint, ItemId } = Upgrade;

    const safeUpgradeFingerprint = UpgradeFingerprint || '{"lvl":0}';
    const parsedUpgradeFingerprint = JSON.parse(safeUpgradeFingerprint) as { lvl: number };
    parsedUpgradeFingerprint.lvl += LevelDiff;
    const stringifiedUpgradeFingerprint = JSON.stringify(parsedUpgradeFingerprint);

    let itemIndex = Upgrades.findIndex(upgrade => upgrade._id?.equals(ItemId!.$oid));

    if (itemIndex !== -1) {
        Upgrades[itemIndex].UpgradeFingerprint = stringifiedUpgradeFingerprint;
        inventory.markModified(`Upgrades.${itemIndex}.UpgradeFingerprint`);
    } else {
        itemIndex =
            Upgrades.push({
                UpgradeFingerprint: stringifiedUpgradeFingerprint,
                ItemType
            }) - 1;

        const rawItemIndex = RawUpgrades.findIndex(rawUpgrade => rawUpgrade.ItemType === ItemType);
        RawUpgrades[rawItemIndex].ItemCount--;
        if (RawUpgrades[rawItemIndex].ItemCount > 0) {
            inventory.markModified(`RawUpgrades.${rawItemIndex}.UpgradeFingerprint`);
        } else {
            RawUpgrades.splice(rawItemIndex, 1);
        }
    }

    if (!config.infiniteCredits) {
        inventory.RegularCredits -= Cost;
    }
    if (!config.infiniteEndo) {
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
    const itemId = changedInventory.toJSON().Upgrades[itemIndex]?.ItemId?.$oid;

    if (!itemId) {
        throw new Error("Item Id not found in upgradeMod");
    }

    res.send(itemId);
};

interface IArtifactsRequest {
    Upgrade: ICrewShipSalvagedWeaponSkin;
    LevelDiff: number;
    Cost: number;
    FusionPointCost: number;
    LegendaryFusion?: boolean;
}
