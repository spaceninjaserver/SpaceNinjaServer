import type { RequestHandler } from "express";
import {
    claimLoginReward,
    getRandomLoginRewards,
    setAccountGotLoginRewardToday,
    type ILoginReward
} from "../../services/loginRewardService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { sendWsBroadcastTo } from "../../services/wsService.ts";
import { logger } from "../../utils/logger.ts";

export const giveLoginRewardController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const today = Math.trunc(Date.now() / 86400000) * 86400;
    if (account.LastLoginRewardDate == today) {
        logger.debug(`login reward was already pre-emptively claimed server-side, so ignoring manual claim`);
        res.json({});
    } else {
        const body = getJSONfromString<IGiveLoginRewardRequest>(String(req.body));
        const inventory = await getInventory(account._id, undefined);

        const randomRewards = getRandomLoginRewards(account, inventory);
        const chosenReward = randomRewards.find(x => x.StoreItemType == body.reward.StoreItemType)!;
        const inventoryChanges = await claimLoginReward(inventory, chosenReward);

        setAccountGotLoginRewardToday(account, inventory);
        await Promise.all([inventory.save(), account.save()]);

        sendWsBroadcastTo(account._id.toString(), { update_inventory: true });
        res.json(inventoryChanges);
    }
};

interface IGiveLoginRewardRequest {
    reward: ILoginReward;
}
