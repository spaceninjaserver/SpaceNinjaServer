import { ExportRegions, ExportRewards, IReward } from "warframe-public-export-plus";
import { IMissionInventoryUpdateRequest, IRewardInfo } from "../types/requestTypes";
import { logger } from "@/src/utils/logger";
import { IRngResult, getRandomReward } from "@/src/services/rngService";
import { IInventoryDatabase } from "@/src/types/inventoryTypes/inventoryTypes";
import {
    addChallenges,
    addConsumables,
    addFusionTreasures,
    addGearExpByCategory,
    addItem,
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
    "/Lotus/Types/StoreItems/CreditBundles/Zariman/TableACreditsUncommon": 30000
};

export const fusionBundles: Record<string, number> = {
    "/Lotus/Upgrades/Mods/FusionBundles/CommonFusionBundle": 15,
    "/Lotus/Upgrades/Mods/FusionBundles/UncommonFusionBundle": 50,
    "/Lotus/Upgrades/Mods/FusionBundles/RareFusionBundle": 80
};

type Entries<T, K extends keyof T = keyof T> = (K extends unknown ? [K, T[K]] : never)[];

function getEntriesUnsafe<T extends object>(object: T): Entries<T> {
    return Object.entries(object) as Entries<T>;
}

type TMissionInventoryUpdateKeys = keyof IMissionInventoryUpdateRequest;
const ignoredInventoryUpdateKeys = ["FpsAvg", "FpsMax", "FpsMin", "FpsSamples"] satisfies TMissionInventoryUpdateKeys[]; // for keys with no meaning for this server
type TignoredInventoryUpdateKeys = (typeof ignoredInventoryUpdateKeys)[number];
const knownUnhandledKeys: readonly string[] = ["test"] as const; // for unimplemented but important keys

export const addMissionInventoryUpdates = (
    inventory: HydratedDocument<IInventoryDatabase, InventoryDocumentProps>,
    inventoryUpdates: IMissionInventoryUpdateRequest
) => {
    //TODO: type this properly
    const inventoryChanges: Partial<IInventoryDatabase> = {};
    if (inventoryUpdates.MissionFailed === true) {
        return;
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
            case "FusionBundles": {
                let fusionPoints = 0;
                for (const fusionBundle of value) {
                    const fusionPointsTotal = fusionBundles[fusionBundle.ItemType] * fusionBundle.ItemCount;
                    inventory.FusionPoints += fusionPointsTotal;
                    fusionPoints += fusionPointsTotal;
                }
                inventoryChanges.FusionPoints = fusionPoints;
                break;
            }
            // Equipment XP updates
            case "Suits":
            case "LongGuns":
            case "Pistols":
            case "Melee":
            case "SpecialItems":
            case "Sentinels":
            case "SentinelWeapons":
            case "SpaceSuits":
            case "SpaceGuns":
            case "SpaceMelee":
            case "Hoverboards":
            case "OperatorAmps":
            case "MoaPets":
                addGearExpByCategory(inventory, value, key);
                break;
            default:
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

//return partial missioninventoryupdate response
export const addMissionRewards = async (
    inventory: TInventoryDatabaseDocument,
    { RewardInfo: rewardInfo, LevelKeyName: levelKeyName, Missions: missions }: IMissionInventoryUpdateRequest
) => {
    if (!rewardInfo) {
        logger.error("no reward info provided");
        return;
    }

    //TODO: check double reward merging
    const MissionRewards = getRandomMissionDrops(rewardInfo).map(drop => {
        return { StoreItem: drop.type, ItemCount: drop.itemCount };
    });
    console.log("random mission drops:", MissionRewards);
    const inventoryChanges: IInventoryChanges = {};

    let missionCompletionCredits = 0;
    //inventory change is what the client does not know the server updated, although credit updates seem to be taken from totalCredits
    if (levelKeyName) {
        const fixedLevelRewards = getLevelKeyRewards(levelKeyName);
        console.log("fixedLevelRewards", fixedLevelRewards);
        for (const reward of fixedLevelRewards) {
            if (reward.rewardType == "RT_CREDITS") {
                inventory.RegularCredits += reward.amount;
                missionCompletionCredits += reward.amount;
                continue;
            }
            MissionRewards.push({ StoreItem: reward.itemType, ItemCount: 1 });
        }
    }

    if (missions) {
        const levelCreditReward = getLevelCreditRewards(missions?.Tag);
        missionCompletionCredits += levelCreditReward;
        inventory.RegularCredits += levelCreditReward;
        console.log("levelCreditReward", levelCreditReward);
    }

    //TODO: resolve issue with creditbundles
    for (const reward of MissionRewards) {
        //TODO: additem should take in storeItems
        console.log("adding item", reward.StoreItem);
        const inventoryChange = await addItem(inventory, reward.StoreItem.replace("StoreItems/", ""), reward.ItemCount);
        //TODO: combineInventoryChanges improve type safety, merging 2 of the same item?
        //TODO: check for the case when two of the same item are added, combineInventoryChanges should merge them
        //TODO: some conditional types to rule out binchanges?
        combineInventoryChanges(inventoryChanges, inventoryChange.InventoryChanges);
    }

    console.log(inventory.RegularCredits);
    console.log("inventoryChanges", inventoryChanges);
    return { inventoryChanges, MissionRewards, missionCompletionCredits };
};

//might not be faithful to original
//TODO: consider ActiveBoosters
export const calculateFinalCredits = (
    inventory: HydratedDocument<IInventoryDatabase>,
    {
        missionDropCredits,
        missionCompletionCredits,
        rngRewardCredits = 0
    }: { missionDropCredits: number; missionCompletionCredits: number; rngRewardCredits: number }
) => {
    const hasDailyCreditBonus = true;
    const totalCredits = missionDropCredits + missionCompletionCredits + rngRewardCredits;
    console.log(
        "missionDropCredits",
        missionDropCredits,
        "missionCompletionCredits",
        missionCompletionCredits,
        "rngRewardCredits",
        rngRewardCredits
    );
    console.log("totalCredits", totalCredits);

    const finalCredits = {
        MissionCredits: [missionDropCredits, missionDropCredits],
        CreditBonus: [missionCompletionCredits, missionCompletionCredits],
        TotalCredits: [totalCredits, totalCredits]
    };

    if (hasDailyCreditBonus) {
        inventory.RegularCredits += totalCredits;
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
    }
    return drops;
}
