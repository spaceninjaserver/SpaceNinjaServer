import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import type { RequestHandler } from "express";
import type { IUpgradeClient, IUpgradeFromClient } from "../../types/inventoryTypes/inventoryTypes.ts";
import {
    addCrewShipFusionPoints,
    addFusionPoints,
    addMiscItem,
    addMods,
    getInventory2,
    updateCredits
} from "../../services/inventoryService.ts";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";
import { convertFromLegacyFingerprint, fromOid, version_compare } from "../../helpers/inventoryHelpers.ts";
import gameToBuildVersion from "../../constants/gameToBuildVersion.ts";
import { getFusionCoreTypeName } from "../../services/itemDataService.ts";

export const artifactsController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const artifactsData = getJSONfromString<IArtifactsRequest>(String(req.body));

    const { Upgrade, LevelDiff, Cost, FusionPointCost, Consumed, Fingerprint } = artifactsData;

    const inventory = await getInventory2(
        account._id,
        "Upgrades",
        "MiscItems",
        "RawUpgrades",
        "infiniteCredits",
        "RegularCredits",
        "infiniteEndo",
        "FusionPoints",
        "infiniteDirac",
        "CrewShipFusionPoints"
    );
    const { Upgrades } = inventory;
    const { ItemType, UpgradeFingerprint, ItemId } = Upgrade;

    const buildLabel = getBuildLabel(req, account);
    if (version_compare(buildLabel, gameToBuildVersion["18.18.0"]) >= 0) {
        const useDiracForFusion =
            version_compare(buildLabel, gameToBuildVersion["29.10.0"]) < 0 &&
            Upgrade.ItemType.startsWith("/Lotus/Upgrades/Mods/Railjack/");
        const safeUpgradeFingerprint = UpgradeFingerprint || '{"lvl":0}';
        const parsedUpgradeFingerprint = JSON.parse(safeUpgradeFingerprint) as { lvl: number; variant?: number };
        parsedUpgradeFingerprint.lvl += LevelDiff;
        if (artifactsData.VariantFusion !== undefined) {
            parsedUpgradeFingerprint.variant = artifactsData.VariantFusion;
            addMiscItem(inventory, "/Lotus/Types/Items/MiscItems/FoilModUnlocker", -1);
        }
        const stringifiedUpgradeFingerprint = JSON.stringify(parsedUpgradeFingerprint);

        let itemId = fromOid(ItemId);
        let itemIndex = Upgrades.findIndex(upgrade => upgrade._id.equals(itemId));

        if (itemIndex !== -1) {
            Upgrades[itemIndex].UpgradeFingerprint = stringifiedUpgradeFingerprint;
        } else {
            itemIndex =
                Upgrades.push({
                    UpgradeFingerprint: stringifiedUpgradeFingerprint,
                    ItemType
                }) - 1;
            itemId = Upgrades[itemIndex]._id.toString();

            addMods(inventory, [{ ItemType, ItemCount: -1 }]);
        }

        updateCredits(inventory, Cost);

        if (useDiracForFusion) {
            addCrewShipFusionPoints(inventory, -FusionPointCost);
        } else {
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
        const safeUpgradeFingerprint = convertFromLegacyFingerprint(Fingerprint ?? "lvl=0|");
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
                if (
                    version_compare(buildLabel, gameToBuildVersion["13.2.0"]) < 0 &&
                    upgrade.ItemType.includes("ModFuser") &&
                    !upgrade.ItemType.includes("Legendary")
                ) {
                    // Handle using Fusion Cores in pre-U13.2.0 clients.
                    const fingerprint = convertFromLegacyFingerprint((upgrade.UpgradeFingerprint ||= "lvl=0|"));
                    addMods(inventory, [
                        {
                            ItemType: getFusionCoreTypeName(upgrade.ItemType, fingerprint),
                            ItemCount: -1
                        }
                    ]);
                } else if (Upgrades.id(fromOid(upgrade.ItemId))) {
                    Upgrades.pull({ _id: upgrade.ItemId.$id });
                } else {
                    if (upgrade.ItemCount) {
                        addMods(inventory, [
                            {
                                ItemType: upgrade.ItemType,
                                ItemCount: -upgrade.ItemCount
                            }
                        ]);
                    } else {
                        throw new Error(
                            `attempted to consume RawUpgrade of type ${upgrade.ItemType}, but it didn't have an ItemCount?`
                        );
                    }
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
