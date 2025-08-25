import type { RequestHandler } from "express";
import { parseString } from "@/src/helpers/general";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import type { IUpdateQuestRequest } from "@/src/services/questService";
import { updateQuestKey } from "@/src/services/questService";
import { getInventory } from "@/src/services/inventoryService";
import type { IInventoryChanges } from "@/src/types/purchaseTypes";

export const updateQuestController: RequestHandler = async (req, res) => {
    const accountId = parseString(req.query.accountId);
    const updateQuestRequest = getJSONfromString<IUpdateQuestRequest>((req.body as string).toString());

    // updates should be made only to one quest key per request
    if (updateQuestRequest.QuestKeys.length > 1) {
        throw new Error(`quest keys array should only have 1 item, but has ${updateQuestRequest.QuestKeys.length}`);
    }

    const inventory = await getInventory(accountId);

    const updateQuestResponse: { CustomData?: string; InventoryChanges?: IInventoryChanges; MissionRewards: [] } = {
        MissionRewards: []
    };
    updateQuestResponse.InventoryChanges = await updateQuestKey(inventory, updateQuestRequest.QuestKeys);

    //TODO: might need to parse the custom data and add the associated items to inventory
    if (updateQuestRequest.QuestKeys[0].CustomData) {
        updateQuestResponse.CustomData = updateQuestRequest.QuestKeys[0].CustomData;
    }

    await inventory.save();
    res.send(updateQuestResponse);
};
