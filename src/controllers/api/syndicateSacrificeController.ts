import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { ExportSyndicates, ISyndicateSacrifice } from "warframe-public-export-plus";
import { handleStoreItemAcquisition } from "@/src/services/purchaseService";
import { addMiscItems, combineInventoryChanges, getInventory, updateCurrency } from "@/src/services/inventoryService";
import { IInventoryChanges } from "@/src/types/purchaseTypes";
import { toStoreItem } from "@/src/services/itemDataService";
import { logger } from "@/src/utils/logger";

export const syndicateSacrificeController: RequestHandler = async (request, response) => {
    const accountId = await getAccountIdForRequest(request);
    const inventory = await getInventory(accountId);
    const data = getJSONfromString<ISyndicateSacrificeRequest>(String(request.body));

    let syndicate = inventory.Affiliations.find(x => x.Tag == data.AffiliationTag);
    if (!syndicate) {
        syndicate = inventory.Affiliations[inventory.Affiliations.push({ Tag: data.AffiliationTag, Standing: 0 }) - 1];
    }

    const level = data.SacrificeLevel - (syndicate.Title ?? 0);
    const res: ISyndicateSacrificeResponse = {
        AffiliationTag: data.AffiliationTag,
        InventoryChanges: {},
        Level: data.SacrificeLevel,
        LevelIncrease: level <= 0 ? 1 : level,
        NewEpisodeReward: false
    };

    const manifest = ExportSyndicates[data.AffiliationTag];
    let sacrifice: ISyndicateSacrifice | undefined;
    let reward: string | undefined;
    if (data.SacrificeLevel == 0) {
        sacrifice = manifest.initiationSacrifice;
        reward = manifest.initiationReward;
        syndicate.Initiated = true;
    } else {
        sacrifice = manifest.titles?.find(x => x.level == data.SacrificeLevel)?.sacrifice;
    }

    if (sacrifice) {
        res.InventoryChanges = { ...updateCurrency(inventory, sacrifice.credits, false) };

        const miscItemChanges = sacrifice.items.map(x => ({
            ItemType: x.ItemType,
            ItemCount: x.ItemCount * -1
        }));
        addMiscItems(inventory, miscItemChanges);
        res.InventoryChanges.MiscItems = miscItemChanges;
    }

    syndicate.Title ??= 0;
    syndicate.Title += 1;

    if (reward) {
        combineInventoryChanges(
            res.InventoryChanges,
            (await handleStoreItemAcquisition(reward, inventory)).InventoryChanges
        );
    }

    // Quacks like a nightwave syndicate?
    if (manifest.dailyChallenges) {
        const title = manifest.titles!.find(x => x.level == syndicate.Title);
        if (title) {
            res.NewEpisodeReward = true;
            let rewardType: string;
            let rewardCount: number;
            if (title.storeItemReward) {
                rewardType = title.storeItemReward;
                rewardCount = 1;
            } else {
                rewardType = toStoreItem(title.reward!.ItemType);
                rewardCount = title.reward!.ItemCount;
            }
            const rewardInventoryChanges = (await handleStoreItemAcquisition(rewardType, inventory, rewardCount))
                .InventoryChanges;
            if (Object.keys(rewardInventoryChanges).length == 0) {
                logger.debug(`nightwave rank up reward did not seem to get added, giving 50 creds instead`);
                const nightwaveCredsItemType = manifest.titles![0].reward!.ItemType;
                rewardInventoryChanges.MiscItems = [{ ItemType: nightwaveCredsItemType, ItemCount: 50 }];
                addMiscItems(inventory, rewardInventoryChanges.MiscItems);
            }
            combineInventoryChanges(res.InventoryChanges, rewardInventoryChanges);
        }
    } else {
        if (syndicate.Title > 0 && manifest.favours.find(x => x.rankUpReward && x.requiredLevel == syndicate.Title)) {
            syndicate.FreeFavorsEarned ??= [];
            if (!syndicate.FreeFavorsEarned.includes(syndicate.Title)) {
                syndicate.FreeFavorsEarned.push(syndicate.Title);
            }
        }
    }

    await inventory.save();

    response.json(res);
};

interface ISyndicateSacrificeRequest {
    AffiliationTag: string;
    SacrificeLevel: number;
    AllowMultiple: boolean;
}

interface ISyndicateSacrificeResponse {
    AffiliationTag: string;
    Level: number;
    LevelIncrease: number;
    InventoryChanges: IInventoryChanges;
    NewEpisodeReward: boolean;
}
