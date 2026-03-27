import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";
import type { IUpgradeClient, IUpgradeFromClient } from "../../types/inventoryTypes/inventoryTypes.ts";
import {
    addFusionPoints,
    addMiscItem,
    addMods,
    CurrencyType,
    getInventory,
    updateCurrency
} from "../../services/inventoryService.ts";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";
import { fromOid, version_compare } from "../../helpers/inventoryHelpers.ts";
import gameToBuildVersion from "../../constants/gameToBuildVersion.ts";

export const artifactsController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const artifactsData = getJSONfromString<IArtifactsRequest>(String(req.body));

    const { Upgrade, LevelDiff, Cost, FusionPointCost, Consumed, Fingerprint } = artifactsData;

    const inventory = await getInventory(account._id);
    const { Upgrades } = inventory;
    const { ItemType, UpgradeFingerprint, ItemId } = Upgrade;

    if (
        "ignoreBuildLabel" in req.query ||
        !account.BuildLabel ||
        version_compare(account.BuildLabel, gameToBuildVersion["18.18.0"]) >= 0
    ) {
        const safeUpgradeFingerprint = UpgradeFingerprint || '{"lvl":0}';
        const parsedUpgradeFingerprint = JSON.parse(safeUpgradeFingerprint) as { lvl: number; variant?: number };
        parsedUpgradeFingerprint.lvl += LevelDiff;
        if (artifactsData.VariantFusion !== undefined) {
            parsedUpgradeFingerprint.variant = artifactsData.VariantFusion;
            addMiscItem(inventory, "/Lotus/Types/Items/MiscItems/FoilModUnlocker", -1);
        }
        const stringifiedUpgradeFingerprint = JSON.stringify(parsedUpgradeFingerprint);

        const itemId = fromOid(ItemId);
        let itemIndex = Upgrades.findIndex(upgrade => upgrade._id.equals(itemId));

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

        updateCurrency(inventory, Cost, CurrencyType.CREDITS);
        if (!inventory.infiniteEndo) {
            addFusionPoints(inventory, -FusionPointCost);
        }

        if (artifactsData.LegendaryFusion) {
            addMods(inventory, [
                {
                    ItemType: "/Lotus/Upgrades/Mods/Fusers/LegendaryModFuser",
                    ItemCount: -1
                }
            ]);
        }

        await inventory.save();

        res.send(itemId);
    } else {
        // Pre-U18.18.0 uses the old pre-Endo fusion system which uses a different UpgradeFingerprint format
        // that has to be converted and consumes upgrades in the fusion proccess
        const safeUpgradeFingerprint = `{"lvl":${Fingerprint?.substring(4, Fingerprint.lastIndexOf("|"))}}`;
        const parsedUpgradeFingerprint = JSON.parse(safeUpgradeFingerprint) as { lvl: number };
        if (LevelDiff) {
            parsedUpgradeFingerprint.lvl += LevelDiff;
        }
        const stringifiedUpgradeFingerprint = JSON.stringify(parsedUpgradeFingerprint);

        let itemIndex = Upgrades.findIndex(upgrade => upgrade._id.equals(ItemId.$id));

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

        const itemId = Upgrades[itemIndex]._id.toString();
        if (!itemId) {
            throw new Error("Item Id not found in upgradeMod");
        }

        if (!inventory.infiniteCredits) {
            inventory.RegularCredits -= Cost;
        }
        if (Consumed && Consumed.length > 0) {
            for (const upgrade of Consumed) {
                // The client does not send the expected information about the mods, so we have to check if it's an Upgrade or RawUpgrade manually.
                if (Upgrades.id(fromOid(upgrade.ItemId))) {
                    Upgrades.pull({ _id: upgrade.ItemId.$id });
                } else {
                    addMods(inventory, [
                        {
                            ItemType: upgrade.ItemType,
                            ItemCount: -1
                        }
                    ]);
                }
            }

            itemIndex = Upgrades.findIndex(upgrade => upgrade._id.equals(itemId));
        }

        await inventory.save();

        res.send(itemId);
    }

    broadcastInventoryUpdate(req);
};

interface IArtifactsRequest {
    Upgrade: IUpgradeClient;
    LevelDiff: number;
    Cost: number;
    FusionPointCost: number;
    LegendaryFusion?: boolean;
    Fingerprint?: string;
    Consumed?: IUpgradeFromClient[];
    VariantFusion?: number;
}
