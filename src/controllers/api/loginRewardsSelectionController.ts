import { getInventory } from "@/src/services/inventoryService";
import {
    claimLoginReward,
    getRandomLoginRewards,
    setAccountGotLoginRewardToday
} from "@/src/services/loginRewardService";
import { getAccountForRequest } from "@/src/services/loginService";
import { handleStoreItemAcquisition } from "@/src/services/purchaseService";
import { sendWsBroadcastTo } from "@/src/services/wsService";
import type { IInventoryChanges } from "@/src/types/purchaseTypes";
import { logger } from "@/src/utils/logger";
import type { RequestHandler } from "express";

export const loginRewardsSelectionController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const inventory = await getInventory(account._id.toString());
    const body = JSON.parse(String(req.body)) as ILoginRewardsSelectionRequest;
    const isMilestoneDay = account.LoginDays == 5 || account.LoginDays % 50 == 0;
    if (body.IsMilestoneReward != isMilestoneDay) {
        logger.warn(`Client disagrees on login milestone (got ${body.IsMilestoneReward}, expected ${isMilestoneDay})`);
    }
    let chosenReward;
    let inventoryChanges: IInventoryChanges;
    if (body.IsMilestoneReward) {
        chosenReward = {
            RewardType: "RT_STORE_ITEM",
            StoreItemType: body.ChosenReward
        };
        inventoryChanges = (await handleStoreItemAcquisition(body.ChosenReward, inventory)).InventoryChanges;
        if (evergreenRewards.indexOf(body.ChosenReward) == -1) {
            inventory.LoginMilestoneRewards.push(body.ChosenReward);
        }
    } else {
        const randomRewards = getRandomLoginRewards(account, inventory);
        chosenReward = randomRewards.find(x => x.StoreItemType == body.ChosenReward)!;
        inventoryChanges = await claimLoginReward(inventory, chosenReward);
    }
    setAccountGotLoginRewardToday(account);
    await Promise.all([inventory.save(), account.save()]);

    sendWsBroadcastTo(account._id.toString(), { update_inventory: true });
    res.json({
        DailyTributeInfo: {
            NewInventory: inventoryChanges,
            ChosenReward: chosenReward
        }
    });
};

interface ILoginRewardsSelectionRequest {
    ChosenReward: string;
    IsMilestoneReward: boolean;
}

const evergreenRewards = [
    "/Lotus/Types/StoreItems/Packages/EvergreenTripleForma",
    "/Lotus/Types/StoreItems/Packages/EvergreenTripleRifleRiven",
    "/Lotus/Types/StoreItems/Packages/EvergreenTripleMeleeRiven",
    "/Lotus/Types/StoreItems/Packages/EvergreenTripleSecondaryRiven",
    "/Lotus/Types/StoreItems/Packages/EvergreenWeaponSlots",
    "/Lotus/Types/StoreItems/Packages/EvergreenKuva",
    "/Lotus/Types/StoreItems/Packages/EvergreenBoosters",
    "/Lotus/Types/StoreItems/Packages/EvergreenEndo",
    "/Lotus/Types/StoreItems/Packages/EvergreenExilus"
];
