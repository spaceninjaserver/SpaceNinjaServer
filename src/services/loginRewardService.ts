import randomRewards from "@/static/fixed_responses/loginRewards/randomRewards.json";
import { IInventoryChanges } from "../types/purchaseTypes";
import { TAccountDocument } from "./loginService";
import { CRng, mixSeeds } from "./rngService";
import { TInventoryDatabaseDocument } from "../models/inventoryModels/inventoryModel";
import { addBooster, updateCurrency } from "./inventoryService";
import { handleStoreItemAcquisition } from "./purchaseService";
import { ExportBoosters, ExportRecipes, ExportWarframes, ExportWeapons } from "warframe-public-export-plus";
import { toStoreItem } from "./itemDataService";

export interface ILoginRewardsReponse {
    DailyTributeInfo: {
        Rewards?: ILoginReward[]; // only set on first call of the day
        IsMilestoneDay?: boolean;
        IsChooseRewardSet?: boolean;
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
    Icon: string;
    //ItemType: "";
    StoreItemType: string; // uniquely identifies the reward
    //ProductCategory: "Pistols";
    Amount: number;
    ScalingMultiplier: number;
    //Durability: "COMMON";
    //DisplayName: "";
    Duration: number;
    //CouponSku: number;
    //Rarity: number;
    Transmission: string;
}

const scaleAmount = (day: number, amount: number, scalingMultiplier: number): number => {
    const divisor = 200 / (amount * scalingMultiplier);
    return amount + Math.min(day, 3000) / divisor;
};

// Always produces the same result for the same account _id & LoginDays pair.
export const isLoginRewardAChoice = (account: TAccountDocument): boolean => {
    const accountSeed = parseInt(account._id.toString().substring(16), 16);
    const rng = new CRng(mixSeeds(accountSeed, account.LoginDays));
    return rng.random() < 0.25; // Using 25% as an approximate chance for pick-a-doors. More conclusive data analysis is needed.
};

// Always produces the same result for the same account _id & LoginDays pair.
export const getRandomLoginRewards = (
    account: TAccountDocument,
    inventory: TInventoryDatabaseDocument
): ILoginReward[] => {
    const accountSeed = parseInt(account._id.toString().substring(16), 16);
    const rng = new CRng(mixSeeds(accountSeed, account.LoginDays));
    const pick_a_door = rng.random() < 0.25; // Using 25% as an approximate chance for pick-a-doors. More conclusive data analysis is needed.
    const rewards = [getRandomLoginReward(rng, account.LoginDays, inventory)];
    if (pick_a_door) {
        do {
            const reward = getRandomLoginReward(rng, account.LoginDays, inventory);
            if (!rewards.find(x => x.StoreItemType == reward.StoreItemType)) {
                rewards.push(reward);
            }
        } while (rewards.length != 3);
    }
    return rewards;
};

const getRandomLoginReward = (rng: CRng, day: number, inventory: TInventoryDatabaseDocument): ILoginReward => {
    const reward = rng.randomReward(randomRewards)!;
    //const reward = randomRewards.find(x => x.RewardType == "RT_BOOSTER")!;
    if (reward.RewardType == "RT_RANDOM_RECIPE") {
        // Not very faithful implementation but roughly the same idea
        const masteredItems = new Set();
        for (const entry of inventory.XPInfo) {
            masteredItems.add(entry.ItemType);
        }
        const unmasteredItems = new Set();
        for (const [uniqueName, data] of Object.entries(ExportWeapons)) {
            if (data.totalDamage != 0 && data.variantType == "VT_NORMAL" && !masteredItems.has(uniqueName)) {
                unmasteredItems.add(uniqueName);
            }
        }
        for (const [uniqueName, data] of Object.entries(ExportWarframes)) {
            if (data.variantType == "VT_NORMAL" && !masteredItems.has(uniqueName)) {
                unmasteredItems.add(uniqueName);
            }
        }
        const eligibleRecipes: string[] = [];
        for (const [uniqueName, recipe] of Object.entries(ExportRecipes)) {
            if (unmasteredItems.has(recipe.resultType)) {
                eligibleRecipes.push(uniqueName);
            }
        }
        reward.StoreItemType = toStoreItem(rng.randomElement(eligibleRecipes));
    }
    return {
        //_id: toOid(new Types.ObjectId()),
        RewardType: reward.RewardType,
        //CouponType: "CPT_PLATINUM",
        Icon: reward.Icon ?? "",
        //ItemType: "",
        StoreItemType: reward.StoreItemType,
        //ProductCategory: "Pistols",
        Amount: reward.Duration ? 1 : Math.round(scaleAmount(day, reward.Amount, reward.ScalingMultiplier)),
        ScalingMultiplier: reward.ScalingMultiplier,
        //Durability: "COMMON",
        //DisplayName: "",
        Duration: reward.Duration ? Math.round(reward.Duration * scaleAmount(day, 1, reward.ScalingMultiplier)) : 0,
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
            return (await handleStoreItemAcquisition(reward.StoreItemType, inventory, reward.Amount)).InventoryChanges;

        case "RT_CREDITS":
            return updateCurrency(inventory, -reward.Amount, false);

        case "RT_BOOSTER": {
            const ItemType = ExportBoosters[reward.StoreItemType].typeName;
            const ExpiryDate = 3600 * reward.Duration;
            addBooster(ItemType, ExpiryDate, inventory);
            return {
                Boosters: [{ ItemType, ExpiryDate }]
            };
        }
    }
    throw new Error(`unknown login reward type: ${reward.RewardType}`);
};

export const setAccountGotLoginRewardToday = (account: TAccountDocument): void => {
    account.LoginDays += 1;
    account.LastLoginRewardDate = Math.trunc(Date.now() / 86400000) * 86400;
};
