import { ExportFusionBundles, ExportRegions, ExportRewards, IReward } from "warframe-public-export-plus";
import { IMissionInventoryUpdateRequest, IRewardInfo } from "../types/requestTypes";
import { logger } from "@/src/utils/logger";
import { IRngResult, getRandomReward } from "@/src/services/rngService";
import { equipmentKeys, IInventoryDatabase, TEquipmentKey } from "@/src/types/inventoryTypes/inventoryTypes";
import {
    addChallenges,
    addConsumables,
    addCrewShipAmmo,
    addCrewShipRawSalvage,
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
import junctionRewards from "@/static/fixed_responses/junctionRewards.json";
import { IJunctionRewards } from "@/src/types/commonTypes";
import { handleStoreItemAcquisition } from "./purchaseService";

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

export const creditBundles: Record<string, number> = {
    "/Lotus/Types/PickUps/Credits/1500Credits": 1500,
    "/Lotus/Types/PickUps/Credits/2000Credits": 2000,
    "/Lotus/Types/PickUps/Credits/2500Credits": 2500,
    "/Lotus/Types/PickUps/Credits/3000Credits": 3000,
    "/Lotus/Types/PickUps/Credits/4000Credits": 4000,
    "/Lotus/Types/PickUps/Credits/5000Credits": 5000,
    "/Lotus/Types/PickUps/Credits/7500Credits": 7500,
    "/Lotus/Types/PickUps/Credits/10000Credits": 10000,
    "/Lotus/Types/PickUps/Credits/5000Hollars": 5000,
    "/Lotus/Types/PickUps/Credits/7500Hollars": 7500,
    "/Lotus/Types/PickUps/Credits/10000Hollars": 10000,
    "/Lotus/Types/PickUps/Credits/CorpusArenaCreditRewards/CorpusArenaRewardOneHard": 105000,
    "/Lotus/Types/PickUps/Credits/CorpusArenaCreditRewards/CorpusArenaRewardTwoHard": 175000,
    "/Lotus/Types/PickUps/Credits/CorpusArenaCreditRewards/CorpusArenaRewardThreeHard": 250000,
    "/Lotus/Types/StoreItems/CreditBundles/Zariman/TableACreditsCommon": 15000,
    "/Lotus/Types/StoreItems/CreditBundles/Zariman/TableACreditsUncommon": 30000,
    "/Lotus/Types/StoreItems/CreditBundles/CreditBundleA": 50000,
    "/Lotus/Types/StoreItems/CreditBundles/CreditBundleC": 175000
};

//type TMissionInventoryUpdateKeys = keyof IMissionInventoryUpdateRequest;
//const ignoredInventoryUpdateKeys = ["FpsAvg", "FpsMax", "FpsMin", "FpsSamples"] satisfies TMissionInventoryUpdateKeys[]; // for keys with no meaning for this server
//type TignoredInventoryUpdateKeys = (typeof ignoredInventoryUpdateKeys)[number];
//const knownUnhandledKeys: readonly string[] = ["test"] as const; // for unimplemented but important keys

export const addMissionInventoryUpdates = (
    inventory: HydratedDocument<IInventoryDatabase, InventoryDocumentProps>,
    inventoryUpdates: IMissionInventoryUpdateRequest
) => {
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
                value.forEach(x => {
                    inventory.LoreFragmentScans.push(x);
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
            case "SeasonChallengeCompletions":
                const processedCompletions = value.map(({ challenge, id }) => ({
                    challenge: challenge.substring(challenge.lastIndexOf("/") + 1),
                    id
                }));

                inventory.SeasonChallengeHistory.push(...processedCompletions);
                break;
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
        RegularCredits: creditDrops
    }: IMissionInventoryUpdateRequest
) => {
    if (!rewardInfo) {
        //TODO: if there is a case where you can have credits collected during a mission but no rewardInfo, add credits needs to be handled earlier
        logger.debug(`Mission ${missions!.Tag} did not have Reward Info `);
        return { MissionRewards: [] };
    }

    //TODO: check double reward merging
    const MissionRewards = getRandomMissionDrops(rewardInfo).map(drop => {
        return { StoreItem: drop.type, ItemCount: drop.itemCount };
    });
    logger.debug("random mission drops:", MissionRewards);
    const inventoryChanges: IInventoryChanges = {};

    let missionCompletionCredits = 0;
    //inventory change is what the client has not rewarded itself, also the client needs to know the credit changes for display
    if (levelKeyName) {
        const fixedLevelRewards = getLevelKeyRewards(levelKeyName);
        //logger.debug(`fixedLevelRewards ${fixedLevelRewards}`);
        for (const reward of fixedLevelRewards) {
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

    if (rewardInfo.node in junctionRewards) {
        const junctionReward = (junctionRewards as IJunctionRewards)[rewardInfo.node];
        for (const item of junctionReward.items) {
            MissionRewards.push({
                StoreItem: item.ItemType,
                ItemCount: item.ItemCount
            });
        }
        if (junctionReward.credits) {
            inventory.RegularCredits += junctionReward.credits;
            missionCompletionCredits += junctionReward.credits;
        }
    }

    for (const reward of MissionRewards) {
        const inventoryChange = await handleStoreItemAcquisition(reward.StoreItem, inventory, reward.ItemCount);
        //TODO: combineInventoryChanges improve type safety, merging 2 of the same item?
        //TODO: check for the case when two of the same item are added, combineInventoryChanges should merge them, but the client also merges them
        //TODO: some conditional types to rule out binchanges?
        combineInventoryChanges(inventoryChanges, inventoryChange.InventoryChanges);
    }

    //node based credit rewards for mission completion
    if (missions) {
        const node = getNode(missions.Tag);

        if (node.missionIndex !== 28) {
            const levelCreditReward = getLevelCreditRewards(missions?.Tag);
            missionCompletionCredits += levelCreditReward;
            inventory.RegularCredits += levelCreditReward;
            logger.debug(`levelCreditReward ${levelCreditReward}`);
        }
    }

    //creditBonus is not correct for mirage mission 3
    const credits = addCredits(inventory, {
        missionCompletionCredits,
        missionDropCredits: creditDrops ?? 0,
        rngRewardCredits: inventoryChanges.RegularCredits ?? 0
    });

    return { inventoryChanges, MissionRewards, credits };
};

//slightly inaccurate compared to official
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

function getLevelCreditRewards(nodeName: string): number {
    const minEnemyLevel = getNode(nodeName).minEnemyLevel;

    return 1000 + (minEnemyLevel - 1) * 100;

    //TODO: get dark sektor fixed credit rewards and railjack bonus
}

function getRandomMissionDrops(RewardInfo: IRewardInfo): IRngResult[] {
    const drops: IRngResult[] = [];
    if (RewardInfo.node in ExportRegions) {
        const region = ExportRegions[RewardInfo.node];
        const rewardManifests = region.rewardManifests ?? [];

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
                        drops.push(drop);
                    }
                }
            });

        if (region.cacheRewardManifest && RewardInfo.EnemyCachesFound) {
            const deck = ExportRewards[region.cacheRewardManifest];
            for (let rotation = 0; rotation != RewardInfo.EnemyCachesFound; ++rotation) {
                const drop = getRandomRewardByChance(deck[rotation]);
                if (drop) {
                    drops.push(drop);
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
                drops.push(drop);
            }
        }
    }
    return drops;
}
