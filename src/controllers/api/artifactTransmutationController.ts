import { toOid } from "@/src/helpers/inventoryHelpers";
import { createVeiledRivenFingerprint, rivenRawToRealWeighted } from "@/src/helpers/rivenHelper";
import { addMiscItems, addMods, getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getRandomElement, getRandomWeightedReward, getRandomWeightedRewardUc } from "@/src/services/rngService";
import { IOid } from "@/src/types/commonTypes";
import { RequestHandler } from "express";
import { ExportBoosterPacks, ExportUpgrades, TRarity } from "warframe-public-export-plus";

export const artifactTransmutationController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const payload = JSON.parse(String(req.body)) as IArtifactTransmutationRequest;

    inventory.RegularCredits -= payload.Cost;
    inventory.FusionPoints -= payload.FusionPointCost;

    if (payload.RivenTransmute) {
        addMiscItems(inventory, [
            {
                ItemType: "/Lotus/Types/Gameplay/Eidolon/Resources/SentientSecretItem",
                ItemCount: -1
            }
        ]);

        payload.Consumed.forEach(upgrade => {
            inventory.Upgrades.pull({ _id: upgrade.ItemId.$oid });
        });

        const rawRivenType = getRandomRawRivenType();
        const rivenType = getRandomElement(rivenRawToRealWeighted[rawRivenType]);
        const fingerprint = createVeiledRivenFingerprint(ExportUpgrades[rivenType]);

        const upgradeIndex =
            inventory.Upgrades.push({
                ItemType: rivenType,
                UpgradeFingerprint: JSON.stringify(fingerprint)
            }) - 1;
        await inventory.save();
        res.json({
            NewMods: [
                {
                    ItemId: toOid(inventory.Upgrades[upgradeIndex]._id),
                    ItemType: rivenType,
                    UpgradeFingerprint: fingerprint
                }
            ]
        });
    } else {
        const counts: Record<TRarity, number> = {
            COMMON: 0,
            UNCOMMON: 0,
            RARE: 0,
            LEGENDARY: 0
        };
        payload.Consumed.forEach(upgrade => {
            const meta = ExportUpgrades[upgrade.ItemType];
            counts[meta.rarity] += upgrade.ItemCount;
            addMods(inventory, [
                {
                    ItemType: upgrade.ItemType,
                    ItemCount: upgrade.ItemCount * -1
                }
            ]);
        });

        // Based on the table on https://wiki.warframe.com/w/Transmutation
        const weights: Record<TRarity, number> = {
            COMMON: counts.COMMON * 95 + counts.UNCOMMON * 15 + counts.RARE * 4,
            UNCOMMON: counts.COMMON * 4 + counts.UNCOMMON * 80 + counts.RARE * 10,
            RARE: counts.COMMON * 1 + counts.UNCOMMON * 5 + counts.RARE * 50,
            LEGENDARY: 0
        };

        const options: { uniqueName: string; rarity: TRarity }[] = [];
        Object.entries(ExportUpgrades).forEach(([uniqueName, upgrade]) => {
            if (upgrade.canBeTransmutation) {
                options.push({ uniqueName, rarity: upgrade.rarity });
            }
        });

        const newModType = getRandomWeightedReward(options, weights)!.uniqueName;
        addMods(inventory, [
            {
                ItemType: newModType,
                ItemCount: 1
            }
        ]);

        await inventory.save();
        res.json({
            NewMods: [
                {
                    ItemType: newModType,
                    ItemCount: 1
                }
            ]
        });
    }
};

const getRandomRawRivenType = (): string => {
    const pack = ExportBoosterPacks["/Lotus/Types/BoosterPacks/CalendarRivenPack"];
    return getRandomWeightedRewardUc(pack.components, pack.rarityWeightsPerRoll[0])!.Item;
};

interface IArtifactTransmutationRequest {
    Upgrade: IAgnosticUpgradeClient;
    LevelDiff: number;
    Consumed: IAgnosticUpgradeClient[];
    Cost: number;
    FusionPointCost: number;
    RivenTransmute?: boolean;
}

interface IAgnosticUpgradeClient {
    ItemType: string;
    ItemId: IOid;
    FromSKU: boolean;
    UpgradeFingerprint: string;
    PendingRerollFingerprint: string;
    ItemCount: number;
    LastAdded: IOid;
}
