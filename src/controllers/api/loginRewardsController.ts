import type { RequestHandler } from "express";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import type { ILoginRewardsReponse } from "../../services/loginRewardService.ts";
import {
    claimLoginReward,
    getRandomLoginRewards,
    isLoginRewardAChoice,
    legacyMilestones,
    setAccountGotLoginRewardToday
} from "../../services/loginRewardService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { sendWsBroadcastTo } from "../../services/wsService.ts";
import { version_compare } from "../../helpers/inventoryHelpers.ts";
import gameToBuildVersion from "../../constants/gameToBuildVersion.ts";
import { ExportBoosters, ExportResources } from "warframe-public-export-plus";

export const loginRewardsController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const buildLabel = getBuildLabel(req, account);
    const today = Math.trunc(Date.now() / 86400000) * 86400;

    // https://wiki.warframe.com/w/Login_Rewards
    const is_pre_daily_tribute = version_compare(buildLabel, gameToBuildVersion["18.0.2"]) < 0;
    const is_pre_milestones = version_compare(buildLabel, gameToBuildVersion["23.10.0"]) < 0;

    const isMilestoneDay = is_pre_milestones
        ? account.LoginDays % 50 == 0 && account.LoginDays <= 1000 // legacy milestones programmed up to 1000 day
        : account.LoginDays == 5 || account.LoginDays % 50 == 0; // modern milestones have additional milestone at 5 day

    const nextMilestoneDay = is_pre_milestones
        ? account.LoginDays < 1000
            ? (Math.trunc(account.LoginDays / 50) + 1) * 50
            : 1000
        : account.LoginDays < 5
          ? 5
          : (Math.trunc(account.LoginDays / 50) + 1) * 50;

    if (today != account.LastLoginRewardDate) {
        const inventory = await getInventory(account._id, undefined);
        if (!inventory.disableDailyTribute) {
            const useLegacyMilestone = isMilestoneDay && is_pre_milestones && account.LoginDays <= 1000;
            const randomRewards = useLegacyMilestone
                ? [legacyMilestones[Math.trunc(account.LoginDays / 50) - 1]]
                : await getRandomLoginRewards(account, inventory, buildLabel);
            const response: ILoginRewardsReponse = {
                DailyTributeInfo: {
                    Rewards: randomRewards,
                    IsMilestoneDay: isMilestoneDay,
                    IsChooseRewardSet: randomRewards.length != 1,
                    IsHiddenRewardSet: randomRewards.length != 1,
                    LoginDays: account.LoginDays,
                    NextMilestoneReward: "",
                    NextMilestoneDay: nextMilestoneDay,
                    HasChosenReward: false
                },
                LastLoginRewardDate: today
            };

            if (
                (!isMilestoneDay && randomRewards.length == 1) || // A choice is not needed?
                is_pre_milestones // Or client is unable to make a choice?
            ) {
                response.DailyTributeInfo.HasChosenReward = true;
                response.DailyTributeInfo.ChosenReward = randomRewards[0];
                response.DailyTributeInfo.NewInventory = await claimLoginReward(inventory, randomRewards[0]);
                if (useLegacyMilestone) inventory.LoginMilestoneRewards.push(randomRewards[0].StoreItemType);
                setAccountGotLoginRewardToday(account, inventory);
                await Promise.all([inventory.save(), account.save()]);

                sendWsBroadcastTo(account._id.toString(), { update_inventory: true });
            }
            if (is_pre_daily_tribute) {
                // Ensure the client has an icon it can display.
                for (const reward of response.DailyTributeInfo.Rewards!) {
                    if (reward.Icon == "/Lotus/Interface/Icons/StoreIcons/Currency/CreditsLarge.png") {
                        reward.Icon = "/Lotus/Interface/Icons/Store/CreditBooster.png";
                    } else if (reward.RewardType == "RT_RESOURCE") {
                        reward.Icon = ExportResources[reward.ItemType!].icon.replaceAll(
                            "/Lotus/Interface/Icons/StoreIcons/Resources/CraftingComponents/",
                            "/Lotus/Interface/Icons/Store/"
                        );
                    } else if (reward.RewardType == "RT_BOOSTER") {
                        reward.Icon = ExportBoosters[reward.StoreItemType].icon.replaceAll(
                            "/Lotus/Interface/Icons/StoreIcons/Boosters/",
                            "/Lotus/Interface/Icons/Store/"
                        );
                    }
                }
                res.json({ Rewards: response.DailyTributeInfo.Rewards });
            } else {
                res.json(response);
            }
            return;
        }
    }
    const pick_a_door = isLoginRewardAChoice(account);
    res.json({
        DailyTributeInfo: {
            IsMilestoneDay: isMilestoneDay,
            IsChooseRewardSet: pick_a_door,
            IsHiddenRewardSet: pick_a_door,
            LoginDays: account.LoginDays,
            NextMilestoneReward: "",
            NextMilestoneDay: nextMilestoneDay
        }
    } satisfies ILoginRewardsReponse);
};
