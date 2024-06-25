import { IInventoryDatabaseDocument, IQuestKeyDatabase } from "@/src/types/inventoryTypes/inventoryTypes";
import { IUpdateQuestRequest, IUpdateQuestResponse } from "@/src/types/questTypes";
import { addItem, getInventory } from "@/src/services/inventoryService";
import { logger } from "@/src/utils/logger";
import { ExportKeys, ExportRecipes, ExportResources } from "warframe-public-export-plus";

export const setActiveQuest = async (accountId: string, quest: string) => {
    const inventory = await getInventory(accountId);
    const questKey = inventory.QuestKeys.find(q => q.ItemType == quest);
    if (questKey == null) inventory.QuestKeys.push({ ItemType: quest });
    inventory.ActiveQuest = quest;
    await inventory.save();

    return {
        inventoryChanges: {
            QuestKey: [
                {
                    ItemType: quest
                }
            ],
            Herses: [],
            PremiumCreditsFree: 0,
            PremiumCredits: 0,
            RegularCredits: 0
        }
    };
};

export const updateQuestKeys = async (inventory: IInventoryDatabaseDocument, questKeys: IQuestKeyDatabase[]) => {
    const questKeyIndex = inventory.QuestKeys.findIndex(questKey => questKey.ItemType === questKeys[0].ItemType);

    inventory.QuestKeys[questKeyIndex] = questKeys[0];

    if (questKeys[0].Completed) {
        inventory.QuestKeys[questKeyIndex].CompletionDate = new Date();
    }

    await inventory.save();
};

export const updateQuest = async (accountId: string, updateQuest: IUpdateQuestRequest) => {
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

export const giveKeyChainTriggeredItems = async (accountId: string, keyChain: string, chainStage: number) => {
    const inventory = await getInventory(accountId);

    // TODO:rewards
    const quest = ExportKeys[keyChain];

    if (quest.chainStages) {
        const stage = quest.chainStages[chainStage];

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
            const itemType = stage.itemsToGiveWhenTriggered[0];

            await addItem(accountId, itemType.replace("/Lotus/StoreItems/", "/Lotus/"), 1);

            if (itemType in ExportRecipes) {
                return {
                    Recipes: [{
                        ItemType: itemType,
                        ItemCount: 1
                    }]
                };
            }

            if (itemType in ExportResources) {
                return {
                    WishlistChanges: [itemType],
                    MiscItems: [{
                        ItemType: itemType,
                        ItemCount: 1
                    }]
                };
            }

            // more
        }
    }

    return null;
};

export const giveKeyChainTriggeredMessage = (accountId: string, keyChain: string, chainStage: number) => {
    logger.debug("accountId:" + accountId + "keyChain: " + keyChain + " chainStage: " + chainStage);
    // TODO:message

    return null;
};
