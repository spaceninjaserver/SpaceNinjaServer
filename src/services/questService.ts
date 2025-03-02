import { IKeyChainRequest } from "@/src/controllers/api/giveKeyChainTriggeredItemsController";
import { isEmptyObject } from "@/src/helpers/general";
import { TInventoryDatabaseDocument } from "@/src/models/inventoryModels/inventoryModel";
import { createMessage } from "@/src/services/inboxService";
import { addItem, addKeyChainItems } from "@/src/services/inventoryService";
import { getKeyChainMessage, getLevelKeyRewards } from "@/src/services/itemDataService";
import {
    IInventoryDatabase,
    IQuestKeyClient,
    IQuestKeyDatabase,
    IQuestStage
} from "@/src/types/inventoryTypes/inventoryTypes";
import { logger } from "@/src/utils/logger";
import { HydratedDocument } from "mongoose";
import { ExportKeys } from "warframe-public-export-plus";
import { addFixedLevelRewards } from "./missionInventoryUpdateService";
import { IInventoryChanges } from "../types/purchaseTypes";

export interface IUpdateQuestRequest {
    QuestKeys: Omit<IQuestKeyDatabase, "CompletionDate">[];
    PS: string;
    questCompletion: boolean;
    PlayerShipEvents: unknown[];
    crossPlaySetting: string;
    DoQuestReward: boolean;
}

export const updateQuestKey = (
    inventory: HydratedDocument<IInventoryDatabase>,
    questKeyUpdate: IUpdateQuestRequest["QuestKeys"]
): void => {
    if (questKeyUpdate.length > 1) {
        logger.error(`more than 1 quest key not supported`);
        throw new Error("more than 1 quest key not supported");
    }

    const questKeyIndex = inventory.QuestKeys.findIndex(questKey => questKey.ItemType === questKeyUpdate[0].ItemType);

    if (questKeyIndex === -1) {
        throw new Error(`quest key ${questKeyUpdate[0].ItemType} not found`);
    }

    inventory.QuestKeys[questKeyIndex] = questKeyUpdate[0];

    if (questKeyUpdate[0].Completed) {
        inventory.QuestKeys[questKeyIndex].CompletionDate = new Date();
    }
};

export const updateQuestStage = (
    inventory: TInventoryDatabaseDocument,
    { KeyChain, ChainStage }: IKeyChainRequest,
    questStageUpdate: IQuestStage
): void => {
    const quest = inventory.QuestKeys.find(quest => quest.ItemType === KeyChain);

    if (!quest) {
        throw new Error(`Quest ${KeyChain} not found in QuestKeys`);
    }

    if (!quest.Progress) {
        throw new Error(`Progress should always exist when giving keychain triggered items or messages`);
    }

    const questStage = quest.Progress[ChainStage];

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!questStage) {
        const questStageIndex = quest.Progress.push(questStageUpdate) - 1;
        if (questStageIndex !== ChainStage) {
            throw new Error(`Quest stage index mismatch: ${questStageIndex} !== ${ChainStage}`);
        }
        return;
    }

    Object.assign(questStage, questStageUpdate);
};

export const addQuestKey = (inventory: TInventoryDatabaseDocument, questKey: IQuestKeyDatabase) => {
    if (inventory.QuestKeys.some(q => q.ItemType === questKey.ItemType)) {
        logger.warn(`Quest key ${questKey.ItemType} already exists. It will not be added`);
        return;
    }
    const index = inventory.QuestKeys.push(questKey);

    return inventory.QuestKeys[index - 1].toJSON<IQuestKeyClient>();
};

export const completeQuest = async (inventory: TInventoryDatabaseDocument, questKey: string) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const chainStages = ExportKeys[questKey]?.chainStages;

    if (!chainStages) {
        throw new Error(`Quest ${questKey} does not contain chain stages`);
    }

    const chainStageTotal = ExportKeys[questKey].chainStages?.length ?? 0;

    const existingQuestKey = inventory.QuestKeys.find(qk => qk.ItemType === questKey);

    if (existingQuestKey?.Completed) {
        return;
    }
    const Progress = Array(chainStageTotal).fill({
        c: 0,
        i: false,
        m: false,
        b: []
    } satisfies IQuestStage);

    const completedQuestKey: IQuestKeyDatabase = {
        ItemType: questKey,
        Completed: true,
        unlock: true,
        Progress: Progress,
        CompletionDate: new Date()
    };

    //overwrite current quest progress, might lead to multiple quest item rewards
    if (existingQuestKey) {
        existingQuestKey.overwrite(completedQuestKey);
        //Object.assign(existingQuestKey, completedQuestKey);
    } else {
        addQuestKey(inventory, completedQuestKey);
    }

    for (let i = 0; i < chainStageTotal; i++) {
        if (chainStages[i].itemsToGiveWhenTriggered.length > 0) {
            await giveKeyChainItem(inventory, { KeyChain: questKey, ChainStage: i });
        }

        if (chainStages[i].messageToSendWhenTriggered) {
            await giveKeyChainMessage(inventory, inventory.accountOwnerId.toString(), {
                KeyChain: questKey,
                ChainStage: i
            });
        }

        const missionName = chainStages[i].key;
        if (missionName) {
            const fixedLevelRewards = getLevelKeyRewards(missionName);
            //logger.debug(`fixedLevelRewards`, fixedLevelRewards);
            if (fixedLevelRewards.levelKeyRewards) {
                const missionRewards: { StoreItem: string; ItemCount: number }[] = [];
                addFixedLevelRewards(fixedLevelRewards.levelKeyRewards, inventory, missionRewards);

                for (const reward of missionRewards) {
                    await addItem(inventory, reward.StoreItem.replace("StoreItems/", ""), reward.ItemCount);
                }
            } else if (fixedLevelRewards.levelKeyRewards2) {
                for (const reward of fixedLevelRewards.levelKeyRewards2) {
                    if (reward.rewardType == "RT_CREDITS") {
                        inventory.RegularCredits += reward.amount;
                        continue;
                    }
                    if (reward.rewardType == "RT_RESOURCE") {
                        await addItem(inventory, reward.itemType.replace("StoreItems/", ""), reward.amount);
                    } else {
                        await addItem(inventory, reward.itemType.replace("StoreItems/", ""));
                    }
                }
            }
        }
    }
    inventory.ActiveQuest = "";
    //TODO: handle quest completion items
};

export const giveKeyChainItem = async (
    inventory: TInventoryDatabaseDocument,
    keyChainInfo: IKeyChainRequest
): Promise<IInventoryChanges> => {
    const inventoryChanges = await addKeyChainItems(inventory, keyChainInfo);

    if (isEmptyObject(inventoryChanges)) {
        throw new Error("inventory changes was empty after getting keychain items: should not happen");
    }
    // items were added: update quest stage's i (item was given)
    updateQuestStage(inventory, keyChainInfo, { i: true });

    return inventoryChanges;

    //TODO: Check whether Wishlist is used to track items which should exist uniquely in the inventory
    /*
    some items are added or removed (not sure) to the wishlist, in that case a 
    WishlistChanges: ["/Lotus/Types/Items/ShipFeatureItems/ArsenalFeatureItem"],
    is added to the response, need to determine for which items this is the case and what purpose this has.
    */
    //{"KeyChain":"/Lotus/Types/Keys/VorsPrize/VorsPrizeQuestKeyChain","ChainStage":0}
    //{"WishlistChanges":["/Lotus/Types/Items/ShipFeatureItems/ArsenalFeatureItem"],"MiscItems":[{"ItemType":"/Lotus/Types/Items/ShipFeatureItems/ArsenalFeatureItem","ItemCount":1}]}
};

export const giveKeyChainMessage = async (
    inventory: TInventoryDatabaseDocument,
    accountId: string,
    keyChainInfo: IKeyChainRequest
): Promise<void> => {
    const keyChainMessage = getKeyChainMessage(keyChainInfo);

    await createMessage(accountId, [keyChainMessage]);

    updateQuestStage(inventory, keyChainInfo, { m: true });
};
