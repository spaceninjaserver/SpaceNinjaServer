import { IInventoryDatabaseDocument, IQuestKeyDatabase } from "@/src/types/inventoryTypes/inventoryTypes";
import { IUpdateQuestRequest, IUpdateQuestResponse } from "@/src/types/questTypes";
import { addItem, getInventory } from "@/src/services/inventoryService";
import { logger } from "@/src/utils/logger";
import { ExportKeys } from "warframe-public-export-plus";

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
    logger.debug("keyChain: " + keyChain + " chainStage: " + chainStage);

    // TODO:rewards
    const quest = ExportKeys[keyChain];

    if (quest.chainStages) {
        for (const chainStage of quest.chainStages) {
            if (chainStage.itemsToGiveWhenTriggered.length > 0) {
                let itemType = chainStage.itemsToGiveWhenTriggered[0];
                if (itemType.indexOf("") > 0) {
                    itemType = itemType.replace("/Lotus/StoreItems/", "/Lotus/");
                }
                await addItem(accountId, itemType, 1);
            }
        }
    }

    return null;
};

export const giveKeyChainTriggeredMessage = (accountId: string, keyChain: string, chainStage: number) => {
    logger.debug("accountId:" + accountId + "keyChain: " + keyChain + " chainStage: " + chainStage);
    // TODO:message

    return null;
};
