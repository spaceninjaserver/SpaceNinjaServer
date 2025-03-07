import {
    ExportFusionBundles,
    ExportRegions,
    ExportRewards,
    IMissionReward as IMissionRewardExternal,
    IReward
} from "warframe-public-export-plus";
import { IMissionInventoryUpdateRequest, IRewardInfo } from "../types/requestTypes";
import { logger } from "@/src/utils/logger";
import { IRngResult, getRandomElement, getRandomReward } from "@/src/services/rngService";
import { equipmentKeys, IInventoryDatabase, TEquipmentKey } from "@/src/types/inventoryTypes/inventoryTypes";
import {
    addChallenges,
    addConsumables,
    addCrewShipAmmo,
    addCrewShipRawSalvage,
    addEmailItem,
    addFocusXpIncreases,
    addFusionTreasures,
    addGearExpByCategory,
    addMiscItems,
    addMissionComplete,
    addMods,
    addRecipes,
    combineInventoryChanges,
    updateSyndicate
} from "@/src/services/inventoryService";
import { updateQuestKey } from "@/src/services/questService";
import { HydratedDocument } from "mongoose";
import { IInventoryChanges } from "@/src/types/purchaseTypes";
import { getLevelKeyRewards, getNode } from "@/src/services/itemDataService";
import { InventoryDocumentProps, TInventoryDatabaseDocument } from "@/src/models/inventoryModels/inventoryModel";
import { getEntriesUnsafe } from "@/src/utils/ts-utils";
import { IEquipmentClient } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { handleStoreItemAcquisition } from "./purchaseService";
import { IMissionReward } from "../types/missionTypes";
import { crackRelic } from "@/src/helpers/relicHelper";
import { createMessage } from "./inboxService";
import kuriaMessage50 from "@/static/fixed_responses/kuriaMessages/fiftyPercent.json";
import kuriaMessage75 from "@/static/fixed_responses/kuriaMessages/seventyFivePercent.json";
import kuriaMessage100 from "@/static/fixed_responses/kuriaMessages/oneHundredPercent.json";

const getRotations = (rotationCount: number): number[] => {
    if (rotationCount === 0) return [0];

    const rotationPattern = [0, 0, 1, 2]; // A, A, B, C
    const rotatedValues = [];

    for (let i = 0; i < rotationCount; i++) {
        rotatedValues.push(rotationPattern[i % rotationPattern.length]);
    }

    return rotatedValues;
};

const getRandomRewardByChance = (pool: IReward[]): IRngResult | undefined => {
    return getRandomReward(pool as IRngResult[]);
};

//type TMissionInventoryUpdateKeys = keyof IMissionInventoryUpdateRequest;
//const ignoredInventoryUpdateKeys = ["FpsAvg", "FpsMax", "FpsMin", "FpsSamples"] satisfies TMissionInventoryUpdateKeys[]; // for keys with no meaning for this server
//type TignoredInventoryUpdateKeys = (typeof ignoredInventoryUpdateKeys)[number];
//const knownUnhandledKeys: readonly string[] = ["test"] as const; // for unimplemented but important keys

export const addMissionInventoryUpdates = async (
    inventory: HydratedDocument<IInventoryDatabase, InventoryDocumentProps>,
    inventoryUpdates: IMissionInventoryUpdateRequest
): Promise<Partial<IInventoryDatabase> | undefined> => {
    //TODO: type this properly
    const inventoryChanges: Partial<IInventoryDatabase> = {};
    if (inventoryUpdates.MissionFailed === true) {
        return;
    }
    if (inventoryUpdates.RewardInfo && inventoryUpdates.RewardInfo.periodicMissionTag) {
        const tag = inventoryUpdates.RewardInfo.periodicMissionTag;
        const existingCompletion = inventory.PeriodicMissionCompletions.find(completion => completion.tag === tag);

        if (existingCompletion) {
            existingCompletion.date = new Date();
        } else {
            inventory.PeriodicMissionCompletions.push({
                tag: tag,
                date: new Date()
            });
        }
    }
    for (const [key, value] of getEntriesUnsafe(inventoryUpdates)) {
        if (value === undefined) {
            logger.error(`Inventory update key ${key} has no value `);
            continue;
        }
        switch (key) {
            case "RegularCredits":
                inventory.RegularCredits += value;
                break;
            case "QuestKeys":
                updateQuestKey(inventory, value);
                break;
            case "AffiliationChanges":
                updateSyndicate(inventory, value);
                break;
            // Incarnon Challenges
            case "EvolutionProgress": {
                for (const evoProgress of value) {
                    const entry = inventory.EvolutionProgress
                        ? inventory.EvolutionProgress.find(entry => entry.ItemType == evoProgress.ItemType)
                        : undefined;
                    if (entry) {
                        entry.Progress = evoProgress.Progress;
                        entry.Rank = evoProgress.Rank;
                    } else {
                        inventory.EvolutionProgress ??= [];
                        inventory.EvolutionProgress.push(evoProgress);
                    }
                }
                break;
            }
            case "Missions":
                addMissionComplete(inventory, value);
                break;
            case "LastRegionPlayed":
                inventory.LastRegionPlayed = value;
                break;
            case "RawUpgrades":
                addMods(inventory, value);
                break;
            case "MiscItems":
            case "BonusMiscItems":
                addMiscItems(inventory, value);
                break;
            case "Consumables":
                addConsumables(inventory, value);
                break;
            case "Recipes":
                addRecipes(inventory, value);
                break;
            case "ChallengeProgress":
                addChallenges(inventory, value);
                break;
            case "FusionTreasures":
                addFusionTreasures(inventory, value);
                break;
            case "CrewShipRawSalvage":
                addCrewShipRawSalvage(inventory, value);
                break;
            case "CrewShipAmmo":
                addCrewShipAmmo(inventory, value);
                break;
            case "FusionBundles": {
                let fusionPoints = 0;
                for (const fusionBundle of value) {
                    const fusionPointsTotal =
                        ExportFusionBundles[fusionBundle.ItemType].fusionPoints * fusionBundle.ItemCount;
                    inventory.FusionPoints += fusionPointsTotal;
                    fusionPoints += fusionPointsTotal;
                }
                inventoryChanges.FusionPoints = fusionPoints;
                break;
            }
            case "EmailItems": {
                for (const tc of value) {
                    await addEmailItem(inventory, tc.ItemType);
                }
                break;
            }
            case "FocusXpIncreases": {
                addFocusXpIncreases(inventory, value);
                break;
            }
            case "PlayerSkillGains": {
                inventory.PlayerSkills.LPP_SPACE += value.LPP_SPACE;
                inventory.PlayerSkills.LPP_DRIFTER += value.LPP_DRIFTER;
                break;
            }
            case "CustomMarkers": {
                value.forEach(markers => {
                    const map = inventory.CustomMarkers
                        ? inventory.CustomMarkers.find(entry => entry.tag == markers.tag)
                        : undefined;
                    if (map) {
                        map.markerInfos = markers.markerInfos;
                    } else {
                        inventory.CustomMarkers ??= [];
                        inventory.CustomMarkers.push(markers);
                    }
                });
                break;
            }
            case "LoreFragmentScans":
                value.forEach(clientFragment => {
                    const fragment = inventory.LoreFragmentScans.find(x => x.ItemType == clientFragment.ItemType);
                    if (fragment) {
                        fragment.Progress += clientFragment.Progress;
                    } else {
                        inventory.LoreFragmentScans.push(clientFragment);
                    }
                });
                break;
            case "LibraryScans":
                value.forEach(scan => {
                    let synthesisIgnored = true;
                    if (
                        inventory.LibraryPersonalTarget &&
                        libraryPersonalTargetToAvatar[inventory.LibraryPersonalTarget] == scan.EnemyType
                    ) {
                        let progress = inventory.LibraryPersonalProgress.find(
                            x => x.TargetType == inventory.LibraryPersonalTarget
                        );
                        if (!progress) {
                            progress =
                                inventory.LibraryPersonalProgress[
                                    inventory.LibraryPersonalProgress.push({
                                        TargetType: inventory.LibraryPersonalTarget,
                                        Scans: 0,
                                        Completed: false
                                    }) - 1
                                ];
                        }
                        progress.Scans += scan.Count;
                        if (
                            progress.Scans >=
                            (inventory.LibraryPersonalTarget ==
                            "/Lotus/Types/Game/Library/Targets/DragonframeQuestTarget"
                                ? 3
                                : 10)
                        ) {
                            progress.Completed = true;
                        }
                        logger.debug(`synthesis of ${scan.EnemyType} added to personal target progress`);
                        synthesisIgnored = false;
                    }
                    if (
                        inventory.LibraryActiveDailyTaskInfo &&
                        inventory.LibraryActiveDailyTaskInfo.EnemyTypes.find(x => x == scan.EnemyType)
                    ) {
                        inventory.LibraryActiveDailyTaskInfo.Scans ??= 0;
                        inventory.LibraryActiveDailyTaskInfo.Scans += scan.Count;
                        logger.debug(`synthesis of ${scan.EnemyType} added to daily task progress`);
                        synthesisIgnored = false;
                    }
                    if (synthesisIgnored) {
                        logger.warn(`ignoring synthesis of ${scan.EnemyType} due to not knowing why you did that`);
                    }
                });
                break;
            case "CollectibleScans":
                for (const scan of value) {
                    const entry = inventory.CollectibleSeries?.find(x => x.CollectibleType == scan.CollectibleType);
                    if (entry) {
                        entry.Count = scan.Count;
                        entry.Tracking = scan.Tracking;
                        if (entry.CollectibleType == "/Lotus/Objects/Orokin/Props/CollectibleSeriesOne") {
                            const progress = entry.Count / entry.ReqScans;
                            for (const gate of entry.IncentiveStates) {
                                gate.complete = progress >= gate.threshold;
                                if (gate.complete && !gate.sent) {
                                    gate.sent = true;
                                    if (gate.threshold == 0.5) {
                                        await createMessage(inventory.accountOwnerId.toString(), [kuriaMessage50]);
                                    } else {
                                        await createMessage(inventory.accountOwnerId.toString(), [kuriaMessage75]);
                                    }
                                }
                            }
                            if (progress >= 1.0) {
                                await createMessage(inventory.accountOwnerId.toString(), [kuriaMessage100]);
                            }
                        }
                    } else {
                        logger.warn(`${scan.CollectibleType} was not found in inventory, ignoring scans`);
                    }
                }
                break;
            case "Upgrades":
                value.forEach(clientUpgrade => {
                    const upgrade = inventory.Upgrades.id(clientUpgrade.ItemId.$oid)!;
                    upgrade.UpgradeFingerprint = clientUpgrade.UpgradeFingerprint; // primitive way to copy over the riven challenge progress
                });
                break;
            case "SyndicateId": {
                inventory.CompletedSyndicates.push(value);
                break;
            }
            case "SortieId": {
                inventory.CompletedSorties.push(value);
                break;
            }
            case "SeasonChallengeCompletions": {
                const processedCompletions = value.map(({ challenge, id }) => ({
                    challenge: challenge.substring(challenge.lastIndexOf("/") + 1),
                    id
                }));
                inventory.SeasonChallengeHistory.push(...processedCompletions);
                break;
            }
            default:
                // Equipment XP updates
                if (equipmentKeys.includes(key as TEquipmentKey)) {
                    addGearExpByCategory(inventory, value as IEquipmentClient[], key as TEquipmentKey);
                }
                break;
            // if (
            //     (ignoredInventoryUpdateKeys as readonly string[]).includes(key) ||
            //     knownUnhandledKeys.includes(key)
            // ) {
            //     continue;
            // }
            // logger.error(`Unhandled inventory update key: ${key}`);
        }
    }

    return inventoryChanges;
};

//TODO: return type of partial missioninventoryupdate response
export const addMissionRewards = async (
    inventory: TInventoryDatabaseDocument,
    {
        RewardInfo: rewardInfo,
        LevelKeyName: levelKeyName,
        Missions: missions,
        RegularCredits: creditDrops,
        VoidTearParticipantsCurrWave: voidTearWave
    }: IMissionInventoryUpdateRequest
) => {
    if (!rewardInfo) {
        //TODO: if there is a case where you can have credits collected during a mission but no rewardInfo, add credits needs to be handled earlier
        logger.debug(`Mission ${missions!.Tag} did not have Reward Info `);
        return { MissionRewards: [] };
    }

    //TODO: check double reward merging
    const MissionRewards: IMissionReward[] = getRandomMissionDrops(rewardInfo);
    logger.debug("random mission drops:", MissionRewards);
    const inventoryChanges: IInventoryChanges = {};

    let missionCompletionCredits = 0;
    //inventory change is what the client has not rewarded itself, also the client needs to know the credit changes for display
    if (levelKeyName) {
        const fixedLevelRewards = getLevelKeyRewards(levelKeyName);
        //logger.debug(`fixedLevelRewards ${fixedLevelRewards}`);
        if (fixedLevelRewards.levelKeyRewards) {
            addFixedLevelRewards(fixedLevelRewards.levelKeyRewards, inventory, MissionRewards);
        }
        if (fixedLevelRewards.levelKeyRewards2) {
            for (const reward of fixedLevelRewards.levelKeyRewards2) {
                //quest stage completion credit rewards
                if (reward.rewardType == "RT_CREDITS") {
                    inventory.RegularCredits += reward.amount;
                    missionCompletionCredits += reward.amount;
                    continue;
                }
                MissionRewards.push({
                    StoreItem: reward.itemType,
                    ItemCount: reward.rewardType === "RT_RESOURCE" ? reward.amount : 1
                });
            }
        }
    }

    if (
        missions &&
        missions.Tag != "" // https://onlyg.it/OpenWF/SpaceNinjaServer/issues/1013
    ) {
        const node = getNode(missions.Tag);

        //node based credit rewards for mission completion
        if (node.missionIndex !== 28) {
            const levelCreditReward = getLevelCreditRewards(missions.Tag);
            missionCompletionCredits += levelCreditReward;
            inventory.RegularCredits += levelCreditReward;
            logger.debug(`levelCreditReward ${levelCreditReward}`);
        }

        if (node.missionReward) {
            missionCompletionCredits += addFixedLevelRewards(node.missionReward, inventory, MissionRewards);
        }
    }

    if (rewardInfo.useVaultManifest) {
        MissionRewards.push({
            StoreItem: getRandomElement(corruptedMods),
            ItemCount: 1
        });
    }

    for (const reward of MissionRewards) {
        const inventoryChange = await handleStoreItemAcquisition(reward.StoreItem, inventory, reward.ItemCount);
        //TODO: combineInventoryChanges improve type safety, merging 2 of the same item?
        //TODO: check for the case when two of the same item are added, combineInventoryChanges should merge them, but the client also merges them
        //TODO: some conditional types to rule out binchanges?
        combineInventoryChanges(inventoryChanges, inventoryChange.InventoryChanges);
    }

    const credits = addCredits(inventory, {
        missionCompletionCredits,
        missionDropCredits: creditDrops ?? 0,
        rngRewardCredits: inventoryChanges.RegularCredits ?? 0
    });

    if (
        voidTearWave &&
        voidTearWave.Participants[0].QualifiesForReward &&
        !voidTearWave.Participants[0].HaveRewardResponse
    ) {
        const reward = await crackRelic(inventory, voidTearWave.Participants[0]);
        MissionRewards.push({ StoreItem: reward.type, ItemCount: reward.itemCount });
    }

    return { inventoryChanges, MissionRewards, credits };
};

//creditBonus is not entirely accurate.
//TODO: consider ActiveBoosters
export const addCredits = (
    inventory: HydratedDocument<IInventoryDatabase>,
    {
        missionDropCredits,
        missionCompletionCredits,
        rngRewardCredits
    }: { missionDropCredits: number; missionCompletionCredits: number; rngRewardCredits: number }
) => {
    const hasDailyCreditBonus = true;
    const totalCredits = missionDropCredits + missionCompletionCredits + rngRewardCredits;

    const finalCredits = {
        MissionCredits: [missionDropCredits, missionDropCredits],
        CreditBonus: [missionCompletionCredits, missionCompletionCredits],
        TotalCredits: [totalCredits, totalCredits]
    };

    if (hasDailyCreditBonus) {
        inventory.RegularCredits += missionCompletionCredits;
        finalCredits.CreditBonus[1] *= 2;
        finalCredits.MissionCredits[1] *= 2;
        finalCredits.TotalCredits[1] *= 2;
    }

    if (!hasDailyCreditBonus) {
        return finalCredits;
    }
    return { ...finalCredits, DailyMissionBonus: true };
};

export const addFixedLevelRewards = (
    rewards: IMissionRewardExternal,
    inventory: TInventoryDatabaseDocument,
    MissionRewards: IMissionReward[]
) => {
    let missionBonusCredits = 0;
    if (rewards.credits) {
        missionBonusCredits += rewards.credits;
        inventory.RegularCredits += rewards.credits;
    }
    if (rewards.items) {
        for (const item of rewards.items) {
            MissionRewards.push({
                StoreItem: item,
                ItemCount: 1
            });
        }
    }
    if (rewards.countedItems) {
        for (const item of rewards.countedItems) {
            MissionRewards.push({
                StoreItem: `/Lotus/StoreItems${item.ItemType.substring("Lotus/".length)}`,
                ItemCount: item.ItemCount
            });
        }
    }
    if (rewards.countedStoreItems) {
        for (const item of rewards.countedStoreItems) {
            MissionRewards.push(item);
        }
    }
    return missionBonusCredits;
};

function getLevelCreditRewards(nodeName: string): number {
    const minEnemyLevel = getNode(nodeName).minEnemyLevel;

    return 1000 + (minEnemyLevel - 1) * 100;

    //TODO: get dark sektor fixed credit rewards and railjack bonus
}

function getRandomMissionDrops(RewardInfo: IRewardInfo): IMissionReward[] {
    const drops: IMissionReward[] = [];
    if (RewardInfo.node in ExportRegions) {
        const region = ExportRegions[RewardInfo.node];
        const rewardManifests: string[] =
            RewardInfo.periodicMissionTag == "EliteAlert" || RewardInfo.periodicMissionTag == "EliteAlertB"
                ? ["/Lotus/Types/Game/MissionDecks/EliteAlertMissionRewards/EliteAlertMissionRewards"]
                : region.rewardManifests;

        let rotations: number[] = [];
        if (RewardInfo.VaultsCracked) {
            // For Spy missions, e.g. 3 vaults cracked = A, B, C
            for (let i = 0; i != RewardInfo.VaultsCracked; ++i) {
                rotations.push(i);
            }
        } else {
            const rotationCount = RewardInfo.rewardQualifications?.length || 0;
            rotations = getRotations(rotationCount);
        }
        rewardManifests
            .map(name => ExportRewards[name])
            .forEach(table => {
                for (const rotation of rotations) {
                    const rotationRewards = table[rotation];
                    const drop = getRandomRewardByChance(rotationRewards);
                    if (drop) {
                        drops.push({ StoreItem: drop.type, ItemCount: drop.itemCount });
                    }
                }
            });

        if (region.cacheRewardManifest && RewardInfo.EnemyCachesFound) {
            const deck = ExportRewards[region.cacheRewardManifest];
            for (let rotation = 0; rotation != RewardInfo.EnemyCachesFound; ++rotation) {
                const drop = getRandomRewardByChance(deck[rotation]);
                if (drop) {
                    drops.push({ StoreItem: drop.type, ItemCount: drop.itemCount, FromEnemyCache: true });
                }
            }
        }

        if (RewardInfo.nightmareMode) {
            const deck = ExportRewards["/Lotus/Types/Game/MissionDecks/NightmareModeRewards"];
            let rotation = 0;

            if (region.missionIndex === 3 && RewardInfo.rewardTier) {
                rotation = RewardInfo.rewardTier;
            } else if ([6, 7, 8, 10, 11].includes(region.systemIndex)) {
                rotation = 2;
            } else if ([4, 9, 12, 14, 15, 16, 17, 18].includes(region.systemIndex)) {
                rotation = 1;
            }

            const drop = getRandomRewardByChance(deck[rotation]);
            if (drop) {
                drops.push({ StoreItem: drop.type, ItemCount: drop.itemCount });
            }
        }
    }
    return drops;
}

const corruptedMods = [
    "/Lotus/StoreItems/Upgrades/Mods/Melee/DualStat/CorruptedHeavyDamageChargeSpeedMod", // Corrupt Charge
    "/Lotus/StoreItems/Upgrades/Mods/Pistol/DualStat/CorruptedCritDamagePistol", // Hollow Point
    "/Lotus/StoreItems/Upgrades/Mods/Melee/DualStat/CorruptedDamageSpeedMod", // Spoiled Strike
    "/Lotus/StoreItems/Upgrades/Mods/Pistol/DualStat/CorruptedDamageRecoilPistol", // Magnum Force
    "/Lotus/StoreItems/Upgrades/Mods/Pistol/DualStat/CorruptedMaxClipReloadSpeedPistol", // Tainted Clip
    "/Lotus/StoreItems/Upgrades/Mods/Rifle/DualStat/CorruptedCritRateFireRateRifle", // Critical Delay
    "/Lotus/StoreItems/Upgrades/Mods/Rifle/DualStat/CorruptedDamageRecoilRifle", // Heavy Caliber
    "/Lotus/StoreItems/Upgrades/Mods/Rifle/DualStat/CorruptedMaxClipReloadSpeedRifle", // Tainted Mag
    "/Lotus/StoreItems/Upgrades/Mods/Rifle/DualStat/CorruptedRecoilFireRateRifle", // Vile Precision
    "/Lotus/StoreItems/Upgrades/Mods/Warframe/DualStat/CorruptedDurationRangeWarframe", // Narrow Minded
    "/Lotus/StoreItems/Upgrades/Mods/Warframe/DualStat/CorruptedEfficiencyDurationWarframe", // Fleeting Expertise
    "/Lotus/StoreItems/Upgrades/Mods/Warframe/DualStat/CorruptedPowerEfficiencyWarframe", // Blind Rage
    "/Lotus/StoreItems/Upgrades/Mods/Warframe/DualStat/CorruptedRangePowerWarframe", // Overextended
    "/Lotus/StoreItems/Upgrades/Mods/Shotgun/DualStat/CorruptedAccuracyFireRateShotgun", // Tainted Shell
    "/Lotus/StoreItems/Upgrades/Mods/Shotgun/DualStat/CorruptedDamageAccuracyShotgun", // Vicious Spread
    "/Lotus/StoreItems/Upgrades/Mods/Shotgun/DualStat/CorruptedMaxClipReloadSpeedShotgun", // Burdened Magazine
    "/Lotus/StoreItems/Upgrades/Mods/Pistol/DualStat/CorruptedFireRateDamagePistol", // Anemic Agility
    "/Lotus/StoreItems/Upgrades/Mods/Rifle/DualStat/CorruptedFireRateDamageRifle", // Vile Acceleration
    "/Lotus/StoreItems/Upgrades/Mods/Shotgun/DualStat/CorruptedFireRateDamageShotgun", // Frail Momentum
    "/Lotus/StoreItems/Upgrades/Mods/Shotgun/DualStat/CorruptedCritChanceFireRateShotgun", // Critical Deceleration
    "/Lotus/StoreItems/Upgrades/Mods/Pistol/DualStat/CorruptedCritChanceFireRatePistol", // Creeping Bullseye
    "/Lotus/StoreItems/Upgrades/Mods/Warframe/DualStat/CorruptedPowerStrengthPowerDurationWarframe", // Transient Fortitude
    "/Lotus/StoreItems/Upgrades/Mods/Rifle/DualStat/CorruptedReloadSpeedMaxClipRifle", // Depleted Reload
    "/Lotus/StoreItems/Upgrades/Mods/Warframe/DualStat/FixedShieldAndShieldGatingDuration" // Catalyzing Shields
];

const libraryPersonalTargetToAvatar: Record<string, string> = {
    "/Lotus/Types/Game/Library/Targets/DragonframeQuestTarget":
        "/Lotus/Types/Enemies/Grineer/Desert/Avatars/RifleLancerAvatar",
    "/Lotus/Types/Game/Library/Targets/Research1Target":
        "/Lotus/Types/Enemies/Grineer/Desert/Avatars/RifleLancerAvatar",
    "/Lotus/Types/Game/Library/Targets/Research2Target":
        "/Lotus/Types/Enemies/Corpus/BipedRobot/AIWeek/LaserDiscBipedAvatar",
    "/Lotus/Types/Game/Library/Targets/Research3Target":
        "/Lotus/Types/Enemies/Grineer/Desert/Avatars/EvisceratorLancerAvatar",
    "/Lotus/Types/Game/Library/Targets/Research4Target": "/Lotus/Types/Enemies/Orokin/OrokinHealingAncientAvatar",
    "/Lotus/Types/Game/Library/Targets/Research5Target":
        "/Lotus/Types/Enemies/Corpus/Spaceman/AIWeek/ShotgunSpacemanAvatar",
    "/Lotus/Types/Game/Library/Targets/Research6Target": "/Lotus/Types/Enemies/Infested/AiWeek/Runners/RunnerAvatar",
    "/Lotus/Types/Game/Library/Targets/Research7Target":
        "/Lotus/Types/Enemies/Grineer/AIWeek/Avatars/GrineerMeleeStaffAvatar",
    "/Lotus/Types/Game/Library/Targets/Research8Target": "/Lotus/Types/Enemies/Orokin/OrokinHeavyFemaleAvatar",
    "/Lotus/Types/Game/Library/Targets/Research9Target":
        "/Lotus/Types/Enemies/Infested/AiWeek/Quadrupeds/QuadrupedAvatar",
    "/Lotus/Types/Game/Library/Targets/Research10Target":
        "/Lotus/Types/Enemies/Corpus/Spaceman/AIWeek/NullifySpacemanAvatar"
};
