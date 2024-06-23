import { IMissionRewardResponse, IInventoryFieldType, inventoryFields } from "@/src/types/missionTypes";

import {
    ExportRegions,
    ExportRewards,
    ExportUpgrades,
    ExportGear,
    ExportRecipes,
    ExportRelics,
    IReward
} from "warframe-public-export-plus";
import { IMissionInventoryUpdateRequest } from "../types/requestTypes";
import { logger } from "@/src/utils/logger";

// need reverse engineer rewardSeed, otherwise ingame displayed rotation reward will be different than added to db or displayed on mission end
const getRewards = ({
    RewardInfo
}: IMissionInventoryUpdateRequest): {
    InventoryChanges: IMissionInventoryUpdateRequest;
    MissionRewards: IMissionRewardResponse[];
} => {
    if (!RewardInfo) {
        return { InventoryChanges: {}, MissionRewards: [] };
    }

    const drops: IReward[] = [];
    if (RewardInfo.node in ExportRegions) {
        const region = ExportRegions[RewardInfo.node];
        const rewardManifests = region.rewardManifests ?? [];
        if (rewardManifests.length == 0) {
            return { InventoryChanges: {}, MissionRewards: [] };
        }

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

    logger.debug("Mission rewards:", drops);
    return formatRewardsToInventoryType(drops);
};

const combineRewardAndLootInventory = (
    rewardInventory: IMissionInventoryUpdateRequest,
    lootInventory: IMissionInventoryUpdateRequest
) => {
    const missionCredits = lootInventory.RegularCredits || 0;
    const creditsBonus = rewardInventory.RegularCredits || 0;
    const totalCredits = missionCredits + creditsBonus;
    let FusionPoints = rewardInventory.FusionPoints || 0;

    // Discharge Endo picked up during the mission
    if (lootInventory.FusionBundles) {
        for (const fusionBundle of lootInventory.FusionBundles) {
            if (fusionBundle.ItemType in fusionBundles) {
                FusionPoints += fusionBundles[fusionBundle.ItemType] * fusionBundle.ItemCount;
            } else {
                logger.error(`unknown fusion bundle: ${fusionBundle.ItemType}`);
            }
        }
        lootInventory.FusionBundles = undefined;
    }

    lootInventory.RegularCredits = totalCredits;
    lootInventory.FusionPoints = FusionPoints;
    inventoryFields.forEach((field: IInventoryFieldType) => {
        if (rewardInventory[field] && !lootInventory[field]) {
            lootInventory[field] = [];
        }
        rewardInventory[field]?.forEach(item => lootInventory[field]!.push(item));
    });

    return {
        combinedInventoryChanges: lootInventory,
        TotalCredits: [totalCredits, totalCredits],
        CreditsBonus: [creditsBonus, creditsBonus],
        MissionCredits: [missionCredits, missionCredits],
        FusionPoints: FusionPoints
    };
};

const getRotations = (rotationCount: number): number[] => {
    if (rotationCount === 0) return [0];

    const rotationPattern = [0, 0, 1, 2]; // A, A, B, C
    const rotatedValues = [];

    for (let i = 0; i < rotationCount; i++) {
        rotatedValues.push(rotationPattern[i % rotationPattern.length]);
    }

    return rotatedValues;
};

const getRandomRewardByChance = (data: IReward[]): IReward | undefined => {
    if (data.length == 0) return;

    const totalChance = data.reduce((sum, item) => sum + item.probability!, 0);
    const randomValue = Math.random() * totalChance;

    let cumulativeChance = 0;
    for (const item of data) {
        cumulativeChance += item.probability!;
        if (randomValue <= cumulativeChance) {
            return item;
        }
    }

    return;
};

const creditBundles: Record<string, number> = {
    "/Lotus/StoreItems/Types/PickUps/Credits/1500Credits": 1500,
    "/Lotus/StoreItems/Types/PickUps/Credits/2000Credits": 2000,
    "/Lotus/StoreItems/Types/PickUps/Credits/2500Credits": 2500,
    "/Lotus/StoreItems/Types/PickUps/Credits/3000Credits": 3000,
    "/Lotus/StoreItems/Types/PickUps/Credits/4000Credits": 4000,
    "/Lotus/StoreItems/Types/PickUps/Credits/5000Credits": 5000,
    "/Lotus/StoreItems/Types/PickUps/Credits/7500Credits": 7500,
    "/Lotus/StoreItems/Types/PickUps/Credits/10000Credits": 10000,
    "/Lotus/StoreItems/Types/StoreItems/CreditBundles/Zariman/TableACreditsCommon": 15000,
    "/Lotus/StoreItems/Types/StoreItems/CreditBundles/Zariman/TableACreditsUncommon": 30000,
    "/Lotus/StoreItems/Types/PickUps/Credits/CorpusArenaCreditRewards/CorpusArenaRewardOneHard": 105000,
    "/Lotus/StoreItems/Types/PickUps/Credits/CorpusArenaCreditRewards/CorpusArenaRewardTwoHard": 175000,
    "/Lotus/StoreItems/Types/PickUps/Credits/CorpusArenaCreditRewards/CorpusArenaRewardThreeHard": 25000
};

const fusionBundles: Record<string, number> = {
    "/Lotus/Upgrades/Mods/FusionBundles/CommonFusionBundle": 15,
    "/Lotus/Upgrades/Mods/FusionBundles/UncommonFusionBundle": 50,
    "/Lotus/Upgrades/Mods/FusionBundles/RareFusionBundle": 80
};

const formatRewardsToInventoryType = (
    rewards: IReward[]
): { InventoryChanges: IMissionInventoryUpdateRequest; MissionRewards: IMissionRewardResponse[] } => {
    const InventoryChanges: IMissionInventoryUpdateRequest = {};
    const MissionRewards: IMissionRewardResponse[] = [];
    for (const reward of rewards) {
        if (reward.type in creditBundles) {
            InventoryChanges.RegularCredits ??= 0;
            InventoryChanges.RegularCredits += creditBundles[reward.type] * reward.itemCount;
        } else {
            const type = reward.type.replace("/Lotus/StoreItems/", "/Lotus/");
            if (type in fusionBundles) {
                InventoryChanges.FusionPoints ??= 0;
                InventoryChanges.FusionPoints += fusionBundles[type] * reward.itemCount;
            } else if (type in ExportUpgrades) {
                addRewardResponse(InventoryChanges, MissionRewards, type, reward.itemCount, "RawUpgrades");
            } else if (type in ExportGear) {
                addRewardResponse(InventoryChanges, MissionRewards, type, reward.itemCount, "Consumables");
            } else if (type in ExportRecipes) {
                addRewardResponse(InventoryChanges, MissionRewards, type, reward.itemCount, "Recipes");
            } else if (type in ExportRelics) {
                addRewardResponse(InventoryChanges, MissionRewards, type, reward.itemCount, "MiscItems");
            } else {
                logger.error(`rolled reward ${reward.itemCount}X ${reward.type} but unsure how to give it`);
            }
        }
    }
    return { InventoryChanges, MissionRewards };
};

const addRewardResponse = (
    InventoryChanges: IMissionInventoryUpdateRequest,
    MissionRewards: IMissionRewardResponse[],
    ItemType: string,
    ItemCount: number,
    InventoryCategory: IInventoryFieldType
) => {
    if (!ItemType) return;

    if (!InventoryChanges[InventoryCategory]) {
        InventoryChanges[InventoryCategory] = [];
    }

    const existReward = InventoryChanges[InventoryCategory]!.find(item => item.ItemType === ItemType);
    if (existReward) {
        existReward.ItemCount += ItemCount;
        const missionReward = MissionRewards.find(missionReward => missionReward.TypeName === ItemType);
        if (missionReward) {
            missionReward.ItemCount += ItemCount;
        }
    } else {
        InventoryChanges[InventoryCategory]!.push({ ItemType, ItemCount });
        MissionRewards.push({
            ItemCount,
            TweetText: ItemType, // ensure if/how this even still used, or if it's needed at all
            ProductCategory: InventoryCategory,
            StoreItem: ItemType.replace("/Lotus/", "/Lotus/StoreItems/"),
            TypeName: ItemType
        });
    }
};

export { getRewards, combineRewardAndLootInventory };
