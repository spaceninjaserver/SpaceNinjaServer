import { RequestHandler } from "express";
import { getAccountForRequest } from "@/src/services/loginService";
import { claimLoginReward, getRandomLoginRewards, ILoginRewardsReponse } from "@/src/services/loginRewardService";
import { getInventory } from "@/src/services/inventoryService";

export const loginRewardsController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const today = Math.trunc(Date.now() / 86400000) * 86400;

    if (today == account.LastLoginRewardDate) {
        res.end();
        return;
    }
    account.LoginDays += 1;
    account.LastLoginRewardDate = today;
    await account.save();

    const inventory = await getInventory(account._id.toString());
    const randomRewards = getRandomLoginRewards(account, inventory);
    const isMilestoneDay = account.LoginDays == 5 || account.LoginDays % 50 == 0;
    const response: ILoginRewardsReponse = {
        DailyTributeInfo: {
            Rewards: randomRewards,
            IsMilestoneDay: isMilestoneDay,
            IsChooseRewardSet: randomRewards.length != 1,
            LoginDays: account.LoginDays,
            //NextMilestoneReward: "",
            NextMilestoneDay: account.LoginDays < 5 ? 5 : (Math.trunc(account.LoginDays / 50) + 1) * 50,
            HasChosenReward: false
        },
        LastLoginRewardDate: today
    };
    if (!isMilestoneDay && randomRewards.length == 1) {
        response.DailyTributeInfo.HasChosenReward = true;
        response.DailyTributeInfo.ChosenReward = randomRewards[0];
        response.DailyTributeInfo.NewInventory = await claimLoginReward(inventory, randomRewards[0]);
        await inventory.save();
    }
    res.json(response);
};
