import type { RequestHandler } from "express";
import { getAccountForRequest } from "../../services/loginService.ts";
import type { ILoginRewardsReponse } from "../../services/loginRewardService.ts";
import {
    claimLoginReward,
    getRandomLoginRewards,
    isLoginRewardAChoice,
    setAccountGotLoginRewardToday
} from "../../services/loginRewardService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { config } from "../../services/configService.ts";
import { sendWsBroadcastTo } from "../../services/wsService.ts";

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
        setAccountGotLoginRewardToday(account);
        await Promise.all([inventory.save(), account.save()]);

        sendWsBroadcastTo(account._id.toString(), { update_inventory: true });
    }
    res.json(response);
};
