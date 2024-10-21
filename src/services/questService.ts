import { ExportKeys, ExportRecipes, ExportResources, IKey } from "warframe-public-export-plus";
import { addHerse, addItem, getInventory } from "./inventoryService";
import { logger } from "@/src/utils/logger";
import {
    IGiveKeyChainTriggeredItemsRequest,
    IGiveKeyChainTriggeredItemsResponse,
    ISetActiveQuestResponse,
    IUpdateQuestRequest,
    IUpdateQuestResponse
} from "@/src/types/questTypes";
import { IInventoryDatabaseDocument, IQuestKeyDatabase } from "@/src/types/inventoryTypes/inventoryTypes";
import { toOid } from "@/src/helpers/inventoryHelpers";

const getQuest = (quest: string): IKey | undefined => {
    for (const [k, v] of Object.entries(ExportKeys)) {
        if (k == quest) {
            return v;
        }
    }
    return undefined;
};

export const setActiveQuest = async (accountId: string, quest: string): Promise<ISetActiveQuestResponse> => {
    const inventory = await getInventory(accountId);
    const questKey = inventory.QuestKeys.find(q => q.ItemType == quest);
    if (questKey == null) inventory.QuestKeys.push({ ItemType: quest });
    inventory.ActiveQuest = quest;
    await inventory.save();

    const questData = getQuest(quest);
    if (questData) {
        console.log(questData);
    }
    const result: ISetActiveQuestResponse = {
        inventoryChanges: {
            QuestKey: [],
            Herses: [],
            PremiumCreditsFree: 0,
            PremiumCredits: 0,
            RegularCredits: 0
        }
    };
    switch (quest) {
        case "/Lotus/Types/Keys/DuviriQuest/DuviriQuestKeyChain":
            // eslint-disable-next-line no-case-declarations
            const inventory = await getInventory(accountId);
            // eslint-disable-next-line no-case-declarations
            const questKey = inventory.QuestKeys.find(q => q.ItemType == quest);
            if (questKey == null) inventory.QuestKeys.push({ ItemType: quest });
            inventory.ActiveQuest = quest;
            await inventory.save();
            // eslint-disable-next-line no-case-declarations
            const herse = await addHerse("/Lotus/Types/NeutralCreatures/ErsatzHorse/ErsatzHorsePowerSuit", accountId);
            result.inventoryChanges.QuestKey.push({ ItemType: quest });
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            result.inventoryChanges.Herses.push({ ItemType: herse.ItemType, ItemId: toOid(herse._id) });
            result.inventoryChanges.PremiumCreditsFree = 50;
            result.inventoryChanges.PremiumCredits = 50;
            result.inventoryChanges.RegularCredits = 3000;
            break;
        default:
            result.inventoryChanges.QuestKey.push({ ItemType: quest });
            break;
    }
    return result;
};

export const updateQuestKeys = async (
    inventory: IInventoryDatabaseDocument,
    questKeys: IQuestKeyDatabase[]
): Promise<void> => {
    logger.debug("quest: " + questKeys[0].ItemType);

    const questKeyIndex = inventory.QuestKeys.findIndex(questKey => questKey.ItemType === questKeys[0].ItemType);

    inventory.QuestKeys[questKeyIndex] = questKeys[0];

    if (questKeys[0].Completed) {
        inventory.QuestKeys[questKeyIndex].CompletionDate = new Date();
    }

    await inventory.save();
};

export const updateQuest = async (
    accountId: string,
    updateQuest: IUpdateQuestRequest
): Promise<IUpdateQuestResponse> => {
    const inventory = await getInventory(accountId);

    await updateQuestKeys(inventory, updateQuest.QuestKeys);

    const result: IUpdateQuestResponse = {
        MissionRewards: []
    };

    if (updateQuest.QuestKeys[0].Completed) {
        const quest = ExportKeys[updateQuest.QuestKeys[0].ItemType];
        if (quest.rewards != null) {
            for (const reward of quest.rewards) {
                switch (reward.rewardType) {
                    case "RT_STORE_ITEM":
                        await addItem(accountId, reward.itemType.replace("/Lotus/StoreItems/", "/Lotus/"), 1);
                        break;
                    case "RT_RECIPE":
                        await addItem(accountId, reward.itemType, 1);
                        break;
                    case "RT_CREDITS":
                        inventory.RegularCredits += reward.amount;
                        await inventory.save();
                        break;
                }
                // push MissionRewards
                // result.MissionRewards.push({});
            }
        }
    }

    return result;
};

export const giveKeyChainTriggeredItems = async (
    accountId: string,
    payload: IGiveKeyChainTriggeredItemsRequest
): Promise<IGiveKeyChainTriggeredItemsResponse> => {
    logger.debug("keyChain: " + payload.KeyChain + " chainStage: " + payload.ChainStage);
    const inventory = await getInventory(accountId);

    const quest = ExportKeys[payload.KeyChain];

    const result: IGiveKeyChainTriggeredItemsResponse = {};

    if (quest.chainStages) {
        const stage = quest.chainStages[payload.ChainStage];

        if (stage.key && stage.key in ExportKeys) {
            const stageQuest = ExportKeys[stage.key];
            if (stageQuest.rewards) {
                for (const item of stageQuest.rewards) {
                    switch (item.rewardType) {
                        case "RT_STORE_ITEM":
                            await addItem(accountId, item.itemType.replace("/Lotus/StoreItems/", "/Lotus/"), 1);
                            break;
                        case "RT_CREDITS":
                            inventory.RegularCredits += item.amount;
                            await inventory.save();
                            break;
                    }
                }
            }
        }

        if (stage.itemsToGiveWhenTriggered.length > 0) {
            let itemType = stage.itemsToGiveWhenTriggered[0];
            if (itemType.indexOf("") > 0) {
                itemType = itemType.replace("/Lotus/StoreItems/", "/Lotus/");
            }
            await addItem(accountId, itemType, 1);

            if (itemType in ExportRecipes) {
                result.Recipes = [
                    {
                        ItemType: itemType,
                        ItemCount: 1
                    }
                ];
            }

            if (itemType in ExportResources) {
                result.WishlistChanges = [itemType];
                result.MiscItems = [
                    {
                        ItemType: itemType,
                        ItemCount: 1
                    }
                ];
            }

            // more
        } else {
            result.MissionRewards = [];
        }
    }

    return result;
};

export const giveKeyChainTriggeredMessage = (accountId: string, keyChain: string, chainStage: number): null => {
    logger.debug("accountId:" + accountId + "keyChain: " + keyChain + " chainStage: " + chainStage);
    // TODO:message

    return null;
};
