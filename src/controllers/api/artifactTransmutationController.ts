import { fromOid, toOid2 } from "../../helpers/inventoryHelpers.ts";
import { createVeiledRivenFingerprint, rivenRawToRealWeighted } from "../../helpers/rivenHelper.ts";
import {
    addFusionPoints,
    addMiscItems,
    addMods,
    getInventory2,
    updateCredits
} from "../../services/inventoryService.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import { getRandomElement, getRandomWeightedRewardUc } from "../../services/rngService.ts";
import type { IUpgradeFromClient } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { RequestHandler } from "express";
import type { TRarity } from "warframe-public-export-plus";
import { ExportBoosterPacks, ExportUpgrades } from "warframe-public-export-plus";

export const artifactTransmutationController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const inventory = await getInventory2(
        account._id,
        "infiniteCredits",
        "RegularCredits",
        "infiniteEndo",
        "FusionPoints",
        "MiscItems",
        "Upgrades",
        "RawUpgrades"
    );
    const payload = JSON.parse(String(req.body)) as IArtifactTransmutationRequest;

    updateCredits(inventory, payload.Cost);
    if (payload.FusionPointCost) {
        addFusionPoints(inventory, -payload.FusionPointCost);
    }

    if (payload.RivenTransmute) {
        addMiscItems(inventory, [
            {
                ItemType: "/Lotus/Types/Gameplay/Eidolon/Resources/SentientSecretItem",
                ItemCount: -1
            }
        ]);

        for (const upgrade of payload.Consumed) {
            inventory.Upgrades.pull({ _id: fromOid(upgrade.ItemId) });
        }

        const rawRivenType = getRandomRawRivenType();
        const rivenType = getRandomElement(rivenRawToRealWeighted[rawRivenType])!;
        const IsSentinel =
            rawRivenType == "/Lotus/Upgrades/Mods/Randomized/RawSentinelWeaponRandomMod" ? true : undefined;
        const fingerprint = createVeiledRivenFingerprint(ExportUpgrades[rivenType], IsSentinel);

        const upgradeIndex =
            inventory.Upgrades.push({
                ItemType: rivenType,
                UpgradeFingerprint: JSON.stringify(fingerprint)
            }) - 1;
        await inventory.save();
        res.json({
            NewMods: [
                {
                    ItemId: toOid2(inventory.Upgrades[upgradeIndex]._id, account.BuildLabel),
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
        let forcedPolarity: string | undefined;
        payload.Consumed.forEach(upgrade => {
            upgrade.ItemCount ??= 1;
            const meta = ExportUpgrades[upgrade.ItemType];
            counts[meta.rarity] += upgrade.ItemCount;
            if (fromOid(upgrade.ItemId) != "" && fromOid(upgrade.ItemId) != "000000000000000000000000") {
                inventory.Upgrades.pull({ _id: fromOid(upgrade.ItemId) });
            } else {
                addMods(inventory, [
                    {
                        ItemType: upgrade.ItemType,
                        ItemCount: upgrade.ItemCount * -1
                    }
                ]);
            }
            if (upgrade.ItemType == "/Lotus/Upgrades/Mods/TransmuteCores/AttackTransmuteCore") {
                forcedPolarity = "AP_ATTACK";
            } else if (upgrade.ItemType == "/Lotus/Upgrades/Mods/TransmuteCores/DefenseTransmuteCore") {
                forcedPolarity = "AP_DEFENSE";
            } else if (upgrade.ItemType == "/Lotus/Upgrades/Mods/TransmuteCores/TacticTransmuteCore") {
                forcedPolarity = "AP_TACTIC";
            }
        });

        let newModType: string | undefined;
        for (const specialModSet of specialModSets) {
            if (specialModSet.indexOf(payload.Consumed[0].ItemType) != -1) {
                newModType = getRandomElement(specialModSet);
                break;
            }
        }

        if (!newModType) {
            // Based on the table on https://wiki.warframe.com/w/Transmutation
            const weights: Record<TRarity, number> = {
                COMMON: counts.COMMON * 95 + counts.UNCOMMON * 15 + counts.RARE * 4,
                UNCOMMON: counts.COMMON * 4 + counts.UNCOMMON * 80 + counts.RARE * 10,
                RARE: counts.COMMON * 1 + counts.UNCOMMON * 5 + counts.RARE * 50,
                LEGENDARY: 0
            };

            let options = ExportBoosterPacks["/Lotus/Types/BoosterPacks/ModFuserResult"].components;
            if (forcedPolarity) {
                options = options.filter(({ Item }) => ExportUpgrades[Item].polarity == forcedPolarity);
            }
            newModType = getRandomWeightedRewardUc(options, weights)!.Item;
        }

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
    Upgrade: IUpgradeFromClient;
    LevelDiff: number;
    Consumed: IUpgradeFromClient[];
    Cost: number;
    FusionPointCost?: number;
    RivenTransmute?: boolean;
}

const specialModSets: string[][] = [
    [
        "/Lotus/Upgrades/Mods/Immortal/ImmortalOneMod",
        "/Lotus/Upgrades/Mods/Immortal/ImmortalTwoMod",
        "/Lotus/Upgrades/Mods/Immortal/ImmortalThreeMod",
        "/Lotus/Upgrades/Mods/Immortal/ImmortalFourMod",
        "/Lotus/Upgrades/Mods/Immortal/ImmortalFiveMod",
        "/Lotus/Upgrades/Mods/Immortal/ImmortalSixMod",
        "/Lotus/Upgrades/Mods/Immortal/ImmortalSevenMod",
        "/Lotus/Upgrades/Mods/Immortal/ImmortalEightMod",
        "/Lotus/Upgrades/Mods/Immortal/ImmortalWildcardMod"
    ],
    [
        "/Lotus/Upgrades/Mods/Immortal/AntivirusOneMod",
        "/Lotus/Upgrades/Mods/Immortal/AntivirusTwoMod",
        "/Lotus/Upgrades/Mods/Immortal/AntivirusThreeMod",
        "/Lotus/Upgrades/Mods/Immortal/AntivirusFourMod",
        "/Lotus/Upgrades/Mods/Immortal/AntivirusFiveMod",
        "/Lotus/Upgrades/Mods/Immortal/AntivirusSixMod",
        "/Lotus/Upgrades/Mods/Immortal/AntivirusSevenMod",
        "/Lotus/Upgrades/Mods/Immortal/AntivirusEightMod"
    ],
    [
        "/Lotus/Upgrades/Mods/DataSpike/Potency/GainAntivirusAndSpeedOnUseMod",
        "/Lotus/Upgrades/Mods/DataSpike/Potency/GainAntivirusAndWeaponDamageOnUseMod",
        "/Lotus/Upgrades/Mods/DataSpike/Potency/GainAntivirusLargeOnSingleUseMod",
        "/Lotus/Upgrades/Mods/DataSpike/Potency/GainAntivirusOnUseMod",
        "/Lotus/Upgrades/Mods/DataSpike/Potency/GainAntivirusSmallOnSingleUseMod"
    ]
];
