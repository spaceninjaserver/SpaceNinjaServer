import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { addItem, getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IOid } from "@/src/types/commonTypes";
import { RequestHandler } from "express";

export const giveQuestKeyRewardController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const rewardRequest = getJSONfromString<IQuestKeyRewardRequest>((req.body as Buffer).toString());

    if (Array.isArray(rewardRequest.reward)) {
        throw new Error("Multiple rewards not expected");
    }

    const reward = rewardRequest.reward;
    const inventory = await getInventory(accountId);
    const inventoryChanges = await addItem(inventory, reward.ItemType, reward.Amount);
    await inventory.save();
    res.json(inventoryChanges.InventoryChanges);
    //TODO: consider whishlist changes
};

export interface IQuestKeyRewardRequest {
    reward: IQuestKeyReward;
}

export interface IQuestKeyReward {
    RewardType: string;
    CouponType: string;
    Icon: string;
    ItemType: string;
    StoreItemType: string;
    ProductCategory: string;
    Amount: number;
    ScalingMultiplier: number;
    Durability: string;
    DisplayName: string;
    Duration: number;
    CouponSku: number;
    Syndicate: string;
    //Milestones: any[];
    ChooseSetIndex: number;
    NewSystemReward: boolean;
    _id: IOid;
}
