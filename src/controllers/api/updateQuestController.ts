import { RequestHandler } from "express";
import { isEmptyObject, isObject, parseString } from "@/src/helpers/general";
import { logger } from "@/src/utils/logger";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { IInventoryDatabase, IQuestKeyDatabase, IQuestKeyResponse } from "@/src/types/inventoryTypes/inventoryTypes";
import { getInventory } from "@/src/services/inventoryService";
import { ItemType } from "@/src/helpers/customHelpers/addItemHelpers";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const updateQuestcontroller: RequestHandler = async (req, res) => {
    const accountId = parseString(req.query.accountId);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
    const updateQuestRequest = getJSONfromString(req.body.toString()) as IUpdateQuestRequest;
    const inventory = await getInventory(accountId);

    const InventoryChanges = {};
    // the array of quest keys should always be 1
    if (updateQuestRequest.QuestKeys.length > 1) {
        const errorMessage = `quest keys array should only have 1 item, but has ${updateQuestRequest.QuestKeys.length}`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
    }
    updateQuestKeys(inventory, updateQuestRequest.QuestKeys);

    const questKeyName = updateQuestRequest.QuestKeys[0].ItemType;

    const newQuestKey = getNewQuestKey(questKeyName as newQuestKeys);

    //let the client know of the new quest
    if (newQuestKey) {
        Object.assign(InventoryChanges, addQuestKey(inventory, newQuestKey));
    }

    if (updateQuestRequest.DoQuestReward) {
        const questCompletionItems = getQuestCompletionItems(questKeyName as keyof typeof QuestCompletionItems);

        if (!isEmptyObject(questCompletionItems)) {
            addInventoryItems(inventory, questCompletionItems);
            Object.assign(InventoryChanges, questCompletionItems);
        }
    }

    const questKeys = (await inventory.save()).QuestKeys[1];
    console.log(questKeys);

    //give next quest key and add to quest keys
    //console.log(updateQuestRequest);

    const updateQuestResponse = { MissionRewards: [] };

    if (!isEmptyObject(InventoryChanges)) {
        Object.assign(updateQuestResponse, { InventoryChanges });
    }

    res.send(updateQuestResponse);
};

const updateQuestKeys = (inventory: IInventoryDatabase, questKeyUpdate: IUpdateQuestRequest["QuestKeys"]) => {
    if (questKeyUpdate.length > 1) {
        logger.error(`more than 1 quest key not implemented`);
        throw new Error("more than 1 quest key not implemented");
    }

    const questKeyIndex = inventory.QuestKeys.findIndex(questKey => questKey.ItemType === questKeyUpdate[0].ItemType);
    console.log("quest key index", questKeyIndex);

    if (questKeyIndex < 0) {
        const errorMessage = `quest  ${questKeyUpdate[0].ItemType} not found`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
    }

    inventory.QuestKeys[questKeyIndex] = questKeyUpdate[0];

    if (questKeyUpdate[0].Completed) {
        inventory.QuestKeys[questKeyIndex].CompletionDate = new Date();
    }
};

type IInventoryDatabaseArrayProps = {
    [key in keyof IInventoryDatabase]?: IInventoryDatabase[key];
};

const addInventoryItems = (_inventory: IInventoryDatabase, items: IInventoryDatabaseArrayProps) => {
    console.log(items);
};

const getQuestCompletionItems = (questname: keyof typeof QuestCompletionItems) => {
    return QuestCompletionItems[questname];
};

const QuestCompletionItems = {
    "/Lotus/Types/Keys/InfestedMicroplanetQuest/InfestedMicroplanetQuestKeyChain": {
        Recipes: [{ ItemType: "/Lotus/Types/Recipes/WarframeRecipes/BrokenFrameBlueprint", ItemCount: 1 }]
    }
};
const addQuestKey = (inventory: IInventoryDatabase, questKey: string) => {
    inventory.QuestKeys.push({ ItemType: questKey });
    return { QuestKeys: [{ ItemType: questKey }] };
};

const newQuestKeys = {
    "/Lotus/Types/Items/Quests/QuestKeys/VorsPrizeQuestKey": "/Lotus/Types/Keys/DuviriQuest/DuviriQuestKeyChain"
};

type newQuestKeys = keyof typeof newQuestKeys;

const getNewQuestKey = (lastQuest: newQuestKeys) => {
    return newQuestKeys[lastQuest];
};

export interface IUpdateQuestRequest {
    QuestKeys: Omit<IQuestKeyDatabase, "CompletionDate">[];
    PS: string;
    questCompletion: boolean;
    PlayerShipEvents: any[];
    crossPlaySetting: string;
    DoQuestReward: boolean;
}

// const updateQuestKey = (questKeyToUpdate: IQuestKeyResponse, questKeyUpdate: IQuestKeyResponse) => {};

// const addInventoryItemsByQuestKey = (questname: IQuestNames) => {};
