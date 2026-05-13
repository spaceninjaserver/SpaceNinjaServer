import type { IInventoryChanges } from "../types/purchaseTypes.ts";
import type { TAccountDocument } from "./loginService.ts";
import { mixSeeds, SRng } from "./rngService.ts";
import type { TInventoryDatabaseDocument } from "../models/inventoryModels/inventoryModel.ts";
import { addBooster, updateCurrency } from "./inventoryService.ts";
import { handleStoreItemAcquisition } from "./purchaseService.ts";
import {
    ExportBoosters,
    ExportRecipes,
    ExportWarframes,
    ExportWeapons,
    type TRarity
} from "warframe-public-export-plus";
import { fromStoreItem, getBoosterPack, toStoreItem } from "./itemDataService.ts";
import { logger } from "../utils/logger.ts";
import { version_compare } from "../helpers/inventoryHelpers.ts";
import gameToBuildVersion from "../constants/gameToBuildVersion.ts";

export interface ILoginRewardsReponse {
    DailyTributeInfo: {
        Rewards?: ILoginReward[]; // only set on first call of the day
        IsMilestoneDay?: boolean;
        IsChooseRewardSet?: boolean;
        IsHiddenRewardSet?: boolean; // Seems to be the ~U18 equivalent of IsChooseRewardSet
        LoginDays?: number; // when calling multiple times per day, this is already incremented to represent "tomorrow"
        NextMilestoneReward?: "";
        NextMilestoneDay?: number; // seems to not be used if IsMilestoneDay
        HasChosenReward?: boolean;
        NewInventory?: IInventoryChanges;
        ChosenReward?: ILoginReward;
    };
    LastLoginRewardDate?: number; // only set on first call of the day; today at 0 UTC
}

export interface ILoginReward {
    //_id: IOid;
    RewardType: string;
    //CouponType: "CPT_PLATINUM";
    Icon?: string;
    ItemType?: string; // pre-daily tribute
    StoreItemType: string; // uniquely identifies the reward
    //ProductCategory: "Pistols";
    Amount: number;
    ScalingMultiplier: number;
    //Durability: "COMMON";
    //DisplayName: "";
    Duration?: number;
    //CouponSku: number;
    //Rarity: number;
    Transmission: string;
    HiddenSetIndex?: number; // pre-U23.10, unsure what for
}

const scaleAmount = (day: number, amount: number, scalingMultiplier: number): number => {
    const divisor = 200 / (amount * scalingMultiplier);
    return amount + Math.min(day, 3000) / divisor;
};

// Always produces the same result for the same account _id & LoginDays pair.
export const isLoginRewardAChoice = (account: TAccountDocument): boolean => {
    const accountSeed = parseInt(account._id.toString().substring(16), 16);
    const rng = new SRng(mixSeeds(accountSeed, account.LoginDays));
    return rng.randomFloat() < 0.25;
};

// Always produces the same result for the same account _id & LoginDays pair.
export const getRandomLoginRewards = async (
    account: TAccountDocument,
    inventory: TInventoryDatabaseDocument,
    buildLabel: string
): Promise<ILoginReward[]> => {
    const accountSeed = parseInt(account._id.toString().substring(16), 16);
    const rng = new SRng(mixSeeds(accountSeed, account.LoginDays));
    const pick_a_door = rng.randomFloat() < 0.25;
    const rewards = [await getRandomLoginReward(rng, account.LoginDays, inventory, buildLabel)];
    if (pick_a_door) {
        do {
            const reward = await getRandomLoginReward(rng, account.LoginDays, inventory, buildLabel);
            if (!rewards.find(x => x.StoreItemType == reward.StoreItemType)) {
                rewards.push(reward);
            }
        } while (rewards.length != 3);
    }
    return rewards;
};

const getRandomLoginReward = async (
    rng: SRng,
    day: number,
    inventory: TInventoryDatabaseDocument,
    buildLabel: string
): Promise<ILoginReward> => {
    const filteredPool = randomRewards.filter(r => {
        return !r.minBuildLabel || version_compare(buildLabel, r.minBuildLabel) >= 0;
    });
    const resultPool: (ILoginReward & { probability: number })[] = [];
    const rarityCounts: Record<TRarity, number> = { COMMON: 0, UNCOMMON: 0, RARE: 0, LEGENDARY: 0 };
    for (const entry of filteredPool) {
        ++rarityCounts[entry.Rarity];
    }
    for (const entry of filteredPool) {
        resultPool.push({
            ...entry,
            probability: randomRewardsWeights[entry.Rarity] / rarityCounts[entry.Rarity]
        });
    }
    const reward = rng.randomReward(resultPool)!;
    //const reward = randomRewards.find(x => x.RewardType == "RT_BOOSTER")!;
    let storeItemType: string = reward.StoreItemType;
    if (reward.RewardType == "RT_RANDOM_RECIPE") {
        const masteredItems = new Set();
        for (const entry of inventory.XPInfo) {
            masteredItems.add(entry.ItemType);
        }
        const unmasteredItems = new Set();
        for (const [uniqueName, data] of Object.entries(ExportWeapons)) {
            if (
                data.totalDamage != 0 &&
                data.variantType == "VT_NORMAL" &&
                !masteredItems.has(uniqueName) &&
                data.introducedAt
            ) {
                const date = new Date(data.introducedAt * 1000);
                if (
                    version_compare(
                        buildLabel,
                        `${date.getUTCFullYear()}.${date.getUTCMonth()}.${date.getUTCDate()}.${date.getUTCHours()}.${date.getUTCMinutes()}`
                    ) >= 0
                ) {
                    unmasteredItems.add(uniqueName);
                }
            }
        }
        for (const [uniqueName, data] of Object.entries(ExportWarframes)) {
            if (data.variantType == "VT_NORMAL" && !masteredItems.has(uniqueName) && data.introducedAt) {
                const date = new Date(data.introducedAt * 1000);
                if (
                    version_compare(
                        buildLabel,
                        `${date.getUTCFullYear()}.${date.getUTCMonth()}.${date.getUTCDate()}.${date.getUTCHours()}.${date.getUTCMinutes()}`
                    ) >= 0
                ) {
                    unmasteredItems.add(uniqueName);
                }
            }
        }
        const eligibleRecipes: string[] = [];
        for (const [uniqueName, recipe] of Object.entries(ExportRecipes)) {
            if (!recipe.excludeFromMarket && unmasteredItems.has(recipe.resultType)) {
                eligibleRecipes.push(uniqueName);
            }
        }
        if (eligibleRecipes.length == 0) {
            // This account has all applicable warframes and weapons already mastered (filthy cheater), need a different reward.
            return await getRandomLoginReward(rng, day, inventory, buildLabel);
        }
        storeItemType = toStoreItem(rng.randomElement(eligibleRecipes)!);
    } else if (reward.StoreItemType == "/Lotus/StoreItems/Types/BoosterPacks/LoginRewardRandomProjection") {
        const boosterPackType =
            version_compare(buildLabel, gameToBuildVersion["18.16.0"]) >= 0
                ? "/Lotus/Types/BoosterPacks/LoginRewardRandomProjection"
                : "/Lotus/Types/BoosterPacks/RandomKey";
        const boosterPack = await getBoosterPack(boosterPackType, buildLabel);
        storeItemType = toStoreItem(rng.randomElement(boosterPack!.components)!.Item);
    }
    return {
        //_id: toOid(new Types.ObjectId()),
        RewardType: reward.RewardType,
        //CouponType: "CPT_PLATINUM",
        Icon: reward.Icon ?? "",
        ItemType: storeItemType ? fromStoreItem(storeItemType) : "",
        StoreItemType: storeItemType,
        //ProductCategory: "Pistols",
        Amount: reward.Duration
            ? 1
            : Math.round(
                  scaleAmount(day, reward.Amount, reward.ScalingMultiplier) *
                      (inventory.dailyTributeRewardMultiplier ?? 1)
              ),
        ScalingMultiplier: reward.ScalingMultiplier,
        //Durability: "COMMON",
        //DisplayName: "",
        Duration: reward.Duration
            ? Math.round(
                  reward.Duration *
                      scaleAmount(day, 1, reward.ScalingMultiplier) *
                      (inventory.dailyTributeRewardMultiplier ?? 1)
              )
            : 0,
        //CouponSku: 0,
        //Rarity: 0,
        Transmission: reward.Transmission
    };
};

export const claimLoginReward = async (
    inventory: TInventoryDatabaseDocument,
    reward: ILoginReward
): Promise<IInventoryChanges> => {
    switch (reward.RewardType) {
        case "RT_RESOURCE":
        case "RT_STORE_ITEM":
        case "RT_RECIPE":
        case "RT_RANDOM_RECIPE":
            return (await handleStoreItemAcquisition(reward.StoreItemType, inventory, reward.Amount, undefined, true))
                .InventoryChanges;

        case "RT_CREDITS":
            return updateCurrency(inventory, -reward.Amount, false);

        case "RT_BOOSTER": {
            logger.debug(`claim login reward`, reward); // all other paths already log in some other way
            const ItemType = ExportBoosters[reward.StoreItemType].typeName;
            const ExpiryDate = 3600 * reward.Duration!;
            addBooster(ItemType, ExpiryDate, inventory);
            return {
                Boosters: [{ ItemType, ExpiryDate }]
            };
        }
    }
    throw new Error(`unknown login reward type: ${reward.RewardType}`);
};

export const setAccountGotLoginRewardToday = (
    account: TAccountDocument,
    inventory: Pick<TInventoryDatabaseDocument, "incrementDailyTributeBy50">
): void => {
    if (inventory.incrementDailyTributeBy50) {
        account.LoginDays = Math.max(50, (Math.trunc(account.LoginDays / 50) + 1) * 50);
    } else {
        account.LoginDays += 1;
    }
    account.LastLoginRewardDate = Math.trunc(Date.now() / 86400000) * 86400;
};

const randomRewardsWeights: Record<TRarity, number> = {
    COMMON: 151,
    UNCOMMON: 0,
    RARE: 4,
    LEGENDARY: 0
};

const randomRewards: (ILoginReward & { Rarity: TRarity; minBuildLabel?: string })[] = [
    {
        RewardType: "RT_RESOURCE",
        StoreItemType: "/Lotus/StoreItems/Types/Items/MiscItems/OxiumAlloy",
        Amount: 100,
        ScalingMultiplier: 1,
        Rarity: "COMMON",
        Transmission: "/Lotus/Sounds/Dialog/DailyTribute/Ordis/DDayTribOrdis",
        minBuildLabel: gameToBuildVersion["12.1.2"] // Should be U11.9
    },
    {
        RewardType: "RT_RESOURCE",
        StoreItemType: "/Lotus/StoreItems/Types/Items/MiscItems/Gallium",
        Amount: 1,
        ScalingMultiplier: 1,
        Rarity: "COMMON",
        Transmission: "/Lotus/Sounds/Dialog/DailyTribute/Darvo/DDayTribDarvo"
    },
    {
        RewardType: "RT_RESOURCE",
        StoreItemType: "/Lotus/StoreItems/Types/Items/Research/ChemFragment",
        Amount: 2,
        ScalingMultiplier: 1,
        Rarity: "COMMON",
        Transmission: "/Lotus/Sounds/Dialog/DailyTribute/Darvo/DDayTribDarvo",
        minBuildLabel: gameToBuildVersion["8.0.0"]
    },
    {
        RewardType: "RT_RESOURCE",
        StoreItemType: "/Lotus/StoreItems/Types/Items/MiscItems/Morphic",
        Amount: 1,
        ScalingMultiplier: 1,
        Rarity: "COMMON",
        Transmission: "/Lotus/Sounds/Dialog/DailyTribute/Darvo/DDayTribDarvo"
    },
    {
        RewardType: "RT_RESOURCE",
        StoreItemType: "/Lotus/StoreItems/Types/Items/Research/EnergyFragment",
        Amount: 2,
        ScalingMultiplier: 1,
        Rarity: "COMMON",
        Transmission: "/Lotus/Sounds/Dialog/DailyTribute/Darvo/DDayTribDarvo",
        minBuildLabel: gameToBuildVersion["8.0.0"]
    },
    {
        RewardType: "RT_RESOURCE",
        StoreItemType: "/Lotus/StoreItems/Types/Items/MiscItems/NeuralSensor",
        Amount: 1,
        ScalingMultiplier: 1,
        Rarity: "COMMON",
        Transmission: "/Lotus/Sounds/Dialog/DailyTribute/Darvo/DDayTribDarvo"
    },
    {
        RewardType: "RT_RESOURCE",
        StoreItemType: "/Lotus/StoreItems/Types/Items/Research/BioFragment",
        Amount: 2,
        ScalingMultiplier: 1,
        Rarity: "COMMON",
        Transmission: "/Lotus/Sounds/Dialog/DailyTribute/Darvo/DDayTribDarvo",
        minBuildLabel: gameToBuildVersion["8.0.0"]
    },
    {
        RewardType: "RT_RESOURCE",
        StoreItemType: "/Lotus/StoreItems/Types/Items/MiscItems/Neurode",
        Amount: 1,
        ScalingMultiplier: 1,
        Rarity: "COMMON",
        Transmission: "/Lotus/Sounds/Dialog/DailyTribute/Darvo/DDayTribDarvo"
    },
    {
        RewardType: "RT_RESOURCE",
        StoreItemType: "/Lotus/StoreItems/Types/Items/MiscItems/OrokinCell",
        Amount: 1,
        ScalingMultiplier: 1,
        Rarity: "COMMON",
        Transmission: "/Lotus/Sounds/Dialog/DailyTribute/Darvo/DDayTribDarvo"
    },
    {
        RewardType: "RT_RESOURCE",
        StoreItemType: "/Lotus/StoreItems/Types/Items/MiscItems/Cryotic",
        Amount: 50,
        ScalingMultiplier: 1,
        Rarity: "COMMON",
        Transmission: "/Lotus/Sounds/Dialog/DailyTribute/Darvo/DDayTribDarvo",
        minBuildLabel: gameToBuildVersion["15.0.0"] // Should be U14.5
    },
    {
        RewardType: "RT_RESOURCE",
        StoreItemType: "/Lotus/StoreItems/Types/Items/MiscItems/Tellurium",
        Amount: 1,
        ScalingMultiplier: 1,
        Rarity: "COMMON",
        Transmission: "/Lotus/Sounds/Dialog/DailyTribute/Darvo/DDayTribDarvo",
        minBuildLabel: gameToBuildVersion["15.14.1"] // Should be U15.7.2
    },
    {
        RewardType: "RT_CREDITS",
        StoreItemType: "",
        Icon: "/Lotus/Interface/Icons/StoreIcons/Currency/CreditsLarge.png",
        Amount: 10000,
        ScalingMultiplier: 1,
        Rarity: "COMMON",
        Transmission: "/Lotus/Sounds/Dialog/DailyTribute/Simaris/DDayTribSmrs"
    },
    {
        RewardType: "RT_BOOSTER",
        StoreItemType: "/Lotus/Types/StoreItems/Boosters/AffinityBoosterStoreItem",
        Amount: 1,
        ScalingMultiplier: 2,
        Duration: 3,
        Rarity: "COMMON",
        Transmission: "/Lotus/Sounds/Dialog/DailyTribute/Simaris/DDayTribSmrs"
    },
    {
        RewardType: "RT_BOOSTER",
        StoreItemType: "/Lotus/Types/StoreItems/Boosters/CreditBoosterStoreItem",
        Amount: 1,
        ScalingMultiplier: 2,
        Duration: 3,
        Rarity: "COMMON",
        Transmission: "/Lotus/Sounds/Dialog/DailyTribute/Simaris/DDayTribSmrs"
    },
    {
        RewardType: "RT_BOOSTER",
        StoreItemType: "/Lotus/Types/StoreItems/Boosters/ResourceAmountBoosterStoreItem",
        Amount: 1,
        ScalingMultiplier: 2,
        Duration: 3,
        Rarity: "COMMON",
        Transmission: "/Lotus/Sounds/Dialog/DailyTribute/Simaris/DDayTribSmrs",
        minBuildLabel: gameToBuildVersion["11.1.3"] // Wiki says its in game since Vanilla
    },
    {
        RewardType: "RT_BOOSTER",
        StoreItemType: "/Lotus/Types/StoreItems/Boosters/ResourceDropChanceBoosterStoreItem",
        Amount: 1,
        ScalingMultiplier: 2,
        Duration: 3,
        Rarity: "COMMON",
        Transmission: "/Lotus/Sounds/Dialog/DailyTribute/Simaris/DDayTribSmrs",
        minBuildLabel: gameToBuildVersion["11.1.3"] // Wiki says its in game since Vanilla
    },
    {
        RewardType: "RT_STORE_ITEM",
        StoreItemType: "/Lotus/StoreItems/Upgrades/Mods/FusionBundles/RareFusionBundle",
        Amount: 1,
        ScalingMultiplier: 1,
        Rarity: "COMMON",
        Transmission: "/Lotus/Sounds/Dialog/DailyTribute/Maroo/DDayTribMaroo",
        minBuildLabel: gameToBuildVersion["18.18.0"]
    },
    {
        RewardType: "RT_RECIPE",
        StoreItemType: "/Lotus/StoreItems/Types/Recipes/Components/FormaBlueprint",
        Amount: 1,
        ScalingMultiplier: 0.5,
        Rarity: "RARE",
        Transmission: "/Lotus/Sounds/Dialog/DailyTribute/Maroo/DDayTribMaroo"
    },
    {
        RewardType: "RT_RANDOM_RECIPE",
        StoreItemType: "",
        Amount: 1,
        ScalingMultiplier: 0,
        Rarity: "COMMON",
        Transmission: "/Lotus/Sounds/Dialog/DailyTribute/Teshin/DDayTribTeshin"
    },
    {
        RewardType: "RT_STORE_ITEM",
        StoreItemType: "/Lotus/StoreItems/Types/BoosterPacks/LoginRewardRandomProjection",
        Amount: 1,
        ScalingMultiplier: 1,
        Rarity: "RARE",
        Transmission: "/Lotus/Sounds/Dialog/DailyTribute/Ordis/DDayTribOrdis"
    }
];
