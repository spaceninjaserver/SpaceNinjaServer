import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { ISyndicateSacrifice } from "warframe-public-export-plus";
import { ExportSyndicates } from "warframe-public-export-plus";
import { handleStoreItemAcquisition } from "../../services/purchaseService.ts";
import {
    addItem,
    addMiscItem,
    combineInventoryChanges,
    getInventory,
    updateCurrency
} from "../../services/inventoryService.ts";
import type { IInventoryChanges } from "../../types/purchaseTypes.ts";
import { toStoreItem } from "../../services/itemDataService.ts";
import { logger } from "../../utils/logger.ts";

export const syndicateSacrificeController: RequestHandler = async (request, response) => {
    const accountId = await getAccountIdForRequest(request);
    const inventory = await getInventory(accountId);
    const data = getJSONfromString<ISyndicateSacrificeRequest>(String(request.body));

    let syndicate = inventory.Affiliations.find(x => x.Tag == data.AffiliationTag);
    if (!syndicate) {
        syndicate = inventory.Affiliations[inventory.Affiliations.push({ Tag: data.AffiliationTag, Standing: 0 }) - 1];
    }

    const oldLevel = syndicate.Title ?? 0;
    const levelIncrease = data.SacrificeLevel - oldLevel;
    if (levelIncrease < 0) {
        throw new Error(`syndicate sacrifice can not decrease level`);
    }
    if (levelIncrease > 1 && !data.AllowMultiple) {
        throw new Error(`desired syndicate level is an increase of ${levelIncrease}, max. allowed increase is 1`);
    }

    const res: ISyndicateSacrificeResponse = {
        AffiliationTag: data.AffiliationTag,
        InventoryChanges: {},
        Level: data.SacrificeLevel,
        LevelIncrease: data.SacrificeLevel < 0 ? 1 : levelIncrease,
        NewEpisodeReward: false
    };

    // Process sacrifices and rewards for every level we're reaching
    const manifest = ExportSyndicates[data.AffiliationTag];
    for (let level = oldLevel + Math.min(levelIncrease, 1); level <= data.SacrificeLevel; ++level) {
        let sacrifice: ISyndicateSacrifice | undefined;
        if (level == 0) {
            sacrifice = manifest.initiationSacrifice;
            if (manifest.initiationReward) {
                combineInventoryChanges(
                    res.InventoryChanges,
                    (await handleStoreItemAcquisition(manifest.initiationReward, inventory)).InventoryChanges
                );
            }
            syndicate.Initiated = true;
        } else {
            sacrifice = manifest.titles?.find(x => x.level == level)?.sacrifice;
        }

        if (sacrifice) {
            updateCurrency(inventory, sacrifice.credits, false, res.InventoryChanges);

            for (const item of sacrifice.items) {
                combineInventoryChanges(
                    res.InventoryChanges,
                    await addItem(inventory, item.ItemType, item.ItemCount * -1)
                );
            }
        }

        // Quacks like a nightwave syndicate?
        if (manifest.dailyChallenges) {
            const title = manifest.titles!.find(x => x.level == level);
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
                    addMiscItem(inventory, nightwaveCredsItemType, 50, rewardInventoryChanges);
                }
                combineInventoryChanges(res.InventoryChanges, rewardInventoryChanges);
            }
        } else {
            if (level > 0 && manifest.favours.find(x => x.rankUpReward && x.requiredLevel == level)) {
                syndicate.FreeFavorsEarned ??= [];
                if (!syndicate.FreeFavorsEarned.includes(level)) {
                    syndicate.FreeFavorsEarned.push(level);
                }
            }
        }
    }

    // Commit
    syndicate.Title = data.SacrificeLevel < 0 ? data.SacrificeLevel + 1 : data.SacrificeLevel;
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
