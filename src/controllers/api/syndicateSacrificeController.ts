import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { ExportSyndicates } from "warframe-public-export-plus";
import { handleStoreItemAcquisition } from "@/src/services/purchaseService";
import { getInventory } from "@/src/services/inventoryService";
import { IInventoryChanges } from "@/src/types/purchaseTypes";

export const syndicateSacrificeController: RequestHandler = async (request, response) => {
    const accountId = await getAccountIdForRequest(request);
    const inventory = await getInventory(accountId);
    const data = getJSONfromString(String(request.body)) as ISyndicateSacrifice;

    let syndicate = inventory.Affiliations.find(x => x.Tag == data.AffiliationTag);
    if (!syndicate) {
        syndicate = inventory.Affiliations[inventory.Affiliations.push({ Tag: data.AffiliationTag, Standing: 0 }) - 1];
    }

    let reward: string | undefined;

    const manifest = ExportSyndicates[data.AffiliationTag];
    if (manifest?.initiationReward && data.SacrificeLevel == 0) {
        reward = manifest.initiationReward;
        syndicate.Initiated = true;
    }

    const level = data.SacrificeLevel - (syndicate.Title ?? 0);
    const res: ISyndicateSacrificeResponse = {
        AffiliationTag: data.AffiliationTag,
        InventoryChanges: {},
        Level: data.SacrificeLevel,
        LevelIncrease: level <= 0 ? 1 : level,
        NewEpisodeReward: syndicate?.Tag == "RadioLegionIntermission9Syndicate"
    };

    if (syndicate?.Title !== undefined) syndicate.Title += 1;

    await inventory.save();

    if (reward) {
        res.InventoryChanges = (await handleStoreItemAcquisition(reward, accountId)).InventoryChanges;
    }

    response.json(res);
};

interface ISyndicateSacrifice {
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
