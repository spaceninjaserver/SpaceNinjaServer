import { RequestHandler } from "express";
import { getAccountForRequest } from "@/src/services/loginService";
import {
    claimLoginReward,
    getRandomLoginRewards,
    ILoginRewardsReponse,
    isLoginRewardAChoice,
    setAccountGotLoginRewardToday
} from "@/src/services/loginRewardService";
import { getInventory } from "@/src/services/inventoryService";
import { config } from "@/src/services/configService";

export const loginRewardsController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const today = Math.trunc(Date.now() / 86400000) * 86400;
    const isMilestoneDay = account.LoginDays == 5 || account.LoginDays % 50 == 0;
    const nextMilestoneDay = account.LoginDays < 5 ? 5 : (Math.trunc(account.LoginDays / 50) + 1) * 50;

    if (today == account.LastLoginRewardDate || config.disableDailyTribute) {
        res.json({
            DailyTributeInfo: {
                IsMilestoneDay: isMilestoneDay,
                IsChooseRewardSet: isLoginRewardAChoice(account),
                LoginDays: account.LoginDays,
                NextMilestoneReward: "",
                NextMilestoneDay: nextMilestoneDay
            }
        } satisfies ILoginRewardsReponse);
        return;
    }

    const inventory = await getInventory(account._id.toString());
    const randomRewards = getRandomLoginRewards(account, inventory);
    const response: ILoginRewardsReponse = {
        DailyTributeInfo: {
            Rewards: randomRewards,
            IsMilestoneDay: isMilestoneDay,
            IsChooseRewardSet: randomRewards.length != 1,
            LoginDays: account.LoginDays,
            NextMilestoneReward: "",
            NextMilestoneDay: nextMilestoneDay,
            HasChosenReward: false
        },
        LastLoginRewardDate: today
    };
    if (!isMilestoneDay && randomRewards.length == 1) {
        response.DailyTributeInfo.HasChosenReward = true;
        response.DailyTributeInfo.ChosenReward = randomRewards[0];
        response.DailyTributeInfo.NewInventory = await claimLoginReward(inventory, randomRewards[0]);
        await inventory.save();

        setAccountGotLoginRewardToday(account);
        await account.save();
    }
    res.json(response);
};
