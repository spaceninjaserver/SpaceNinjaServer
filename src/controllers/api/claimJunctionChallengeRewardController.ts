import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { combineInventoryChanges, getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { handleStoreItemAcquisition } from "@/src/services/purchaseService";
import { RequestHandler } from "express";
import { ExportChallenges } from "warframe-public-export-plus";

export const claimJunctionChallengeRewardController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const data = getJSONfromString<IClaimJunctionChallengeRewardRequest>(String(req.body));
    const challengeProgress = inventory.ChallengeProgress.find(x => x.Name == data.Challenge)!;
    if (challengeProgress.ReceivedJunctionReward) {
        throw new Error(`attempt to double-claim junction reward`);
    }
    challengeProgress.ReceivedJunctionReward = true;
    inventory.ClaimedJunctionChallengeRewards ??= [];
    inventory.ClaimedJunctionChallengeRewards.push(data.Challenge);
    const challengeMeta = Object.entries(ExportChallenges).find(arr => arr[0].endsWith("/" + data.Challenge))![1];
    const inventoryChanges = {};
    for (const reward of challengeMeta.countedRewards!) {
        combineInventoryChanges(
            inventoryChanges,
            (await handleStoreItemAcquisition(reward.StoreItem, inventory, reward.ItemCount)).InventoryChanges
        );
    }
    await inventory.save();
    res.json({
        inventoryChanges: inventoryChanges // Yeah, it's "inventoryChanges" in the response here.
    });
};

interface IClaimJunctionChallengeRewardRequest {
    Challenge: string;
}
