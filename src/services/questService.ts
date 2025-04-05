import { IKeyChainRequest } from "@/src/types/requestTypes";
import { isEmptyObject } from "@/src/helpers/general";
import { TInventoryDatabaseDocument } from "@/src/models/inventoryModels/inventoryModel";
import { createMessage } from "@/src/services/inboxService";
import { addItem, addItems, addKeyChainItems, setupKahlSyndicate } from "@/src/services/inventoryService";
import {
    fromStoreItem,
    getKeyChainMessage,
    getLevelKeyRewards,
    getQuestCompletionItems
} from "@/src/services/itemDataService";
import { IQuestKeyClient, IQuestKeyDatabase, IQuestStage } from "@/src/types/inventoryTypes/inventoryTypes";
import { logger } from "@/src/utils/logger";
import { Types } from "mongoose";
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

export const updateQuestKey = async (
    inventory: TInventoryDatabaseDocument,
    questKeyUpdate: IUpdateQuestRequest["QuestKeys"]
): Promise<IInventoryChanges> => {
    if (questKeyUpdate.length > 1) {
        logger.error(`more than 1 quest key not supported`);
        throw new Error("more than 1 quest key not supported");
    }

    const questKeyIndex = inventory.QuestKeys.findIndex(questKey => questKey.ItemType === questKeyUpdate[0].ItemType);

    if (questKeyIndex === -1) {
        throw new Error(`quest key ${questKeyUpdate[0].ItemType} not found`);
    }

    inventory.QuestKeys[questKeyIndex].overwrite(questKeyUpdate[0]);

    let inventoryChanges: IInventoryChanges = {};
    if (questKeyUpdate[0].Completed) {
        inventory.QuestKeys[questKeyIndex].CompletionDate = new Date();

        logger.debug(`completed quest ${questKeyUpdate[0].ItemType} `);
        const questKeyName = questKeyUpdate[0].ItemType;
        const questCompletionItems = getQuestCompletionItems(questKeyName);
        logger.debug(`quest completion items`, questCompletionItems);

        if (questCompletionItems) {
            inventoryChanges = await addItems(inventory, questCompletionItems);
        }
        inventory.ActiveQuest = "";

        if (questKeyUpdate[0].ItemType == "/Lotus/Types/Keys/NewWarQuest/NewWarQuestKeyChain") {
            setupKahlSyndicate(inventory);
        }
    }
    return inventoryChanges;
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

export const addQuestKey = (
    inventory: TInventoryDatabaseDocument,
    questKey: IQuestKeyDatabase
): IQuestKeyClient | undefined => {
    if (inventory.QuestKeys.some(q => q.ItemType === questKey.ItemType)) {
        logger.warn(`Quest key ${questKey.ItemType} already exists. It will not be added`);
        return;
    }

    if (questKey.ItemType == "/Lotus/Types/Keys/InfestedMicroplanetQuest/InfestedMicroplanetQuestKeyChain") {
        void createMessage(inventory.accountOwnerId, [
            {
                sndr: "/Lotus/Language/Bosses/Loid",
                icon: "/Lotus/Interface/Icons/Npcs/Entrati/Loid.png",
                sub: "/Lotus/Language/InfestedMicroplanet/DeimosIntroQuestInboxTitle",
                msg: "/Lotus/Language/InfestedMicroplanet/DeimosIntroQuestInboxMessage"
            }
        ]);
    }

    const index = inventory.QuestKeys.push(questKey);

    return inventory.QuestKeys[index - 1].toJSON<IQuestKeyClient>();
};

export const completeQuest = async (inventory: TInventoryDatabaseDocument, questKey: string): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const chainStages = ExportKeys[questKey]?.chainStages;

    if (!chainStages) {
        throw new Error(`Quest ${questKey} does not contain chain stages`);
    }

    const chainStageTotal = chainStages.length;

    const existingQuestKey = inventory.QuestKeys.find(qk => qk.ItemType === questKey);

    const startingStage = Math.max((existingQuestKey?.Progress?.length ?? 0) - 1, 0);

    if (existingQuestKey?.Completed) {
        return;
    }
    if (existingQuestKey) {
        existingQuestKey.Progress = existingQuestKey.Progress ?? [];

        const existingProgressLength = existingQuestKey.Progress.length;

        if (existingProgressLength < chainStageTotal) {
            const missingProgress: IQuestStage[] = Array.from(
                { length: chainStageTotal - existingProgressLength },
                () =>
                    ({
                        c: 0,
                        i: false,
                        m: false,
                        b: []
                    }) as IQuestStage
            );

            existingQuestKey.Progress.push(...missingProgress);
            existingQuestKey.CompletionDate = new Date();
            existingQuestKey.Completed = true;
        }
    } else {
        const completedQuestKey: IQuestKeyDatabase = {
            ItemType: questKey,
            Completed: true,
            unlock: true,
            Progress: Array(chainStageTotal).fill({
                c: 0,
                i: false,
                m: false,
                b: []
            } satisfies IQuestStage),
            CompletionDate: new Date()
        };
        addQuestKey(inventory, completedQuestKey);
    }

    for (let i = startingStage; i < chainStageTotal; i++) {
        await giveKeyChainStageTriggered(inventory, { KeyChain: questKey, ChainStage: i });

        await giveKeyChainMissionReward(inventory, { KeyChain: questKey, ChainStage: i });
    }

    const questCompletionItems = getQuestCompletionItems(questKey);
    logger.debug(`quest completion items`, questCompletionItems);
    if (questCompletionItems) {
        await addItems(inventory, questCompletionItems);
    }

    if (inventory.ActiveQuest == questKey) inventory.ActiveQuest = "";

    if (questKey == "/Lotus/Types/Keys/NewWarQuest/NewWarQuestKeyChain") {
        setupKahlSyndicate(inventory);
    }
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
    accountId: string | Types.ObjectId,
    keyChainInfo: IKeyChainRequest
): Promise<void> => {
    const keyChainMessage = getKeyChainMessage(keyChainInfo);

    await createMessage(accountId, [keyChainMessage]);

    updateQuestStage(inventory, keyChainInfo, { m: true });
};

export const giveKeyChainMissionReward = async (
    inventory: TInventoryDatabaseDocument,
    keyChainInfo: IKeyChainRequest
): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const chainStages = ExportKeys[keyChainInfo.KeyChain]?.chainStages;

    if (chainStages) {
        const missionName = chainStages[keyChainInfo.ChainStage].key;
        if (missionName) {
            const fixedLevelRewards = getLevelKeyRewards(missionName);
            if (fixedLevelRewards.levelKeyRewards) {
                const missionRewards: { StoreItem: string; ItemCount: number }[] = [];
                addFixedLevelRewards(fixedLevelRewards.levelKeyRewards, inventory, missionRewards);

                for (const reward of missionRewards) {
                    await addItem(inventory, fromStoreItem(reward.StoreItem), reward.ItemCount);
                }

                updateQuestStage(inventory, keyChainInfo, { c: 0 });
            } else if (fixedLevelRewards.levelKeyRewards2) {
                for (const reward of fixedLevelRewards.levelKeyRewards2) {
                    if (reward.rewardType == "RT_CREDITS") {
                        inventory.RegularCredits += reward.amount;
                        continue;
                    }
                    if (reward.rewardType == "RT_RESOURCE") {
                        await addItem(inventory, fromStoreItem(reward.itemType), reward.amount);
                    } else {
                        await addItem(inventory, fromStoreItem(reward.itemType));
                    }
                }

                updateQuestStage(inventory, keyChainInfo, { c: 0 });
            }
        }
    }
};

export const giveKeyChainStageTriggered = async (
    inventory: TInventoryDatabaseDocument,
    keyChainInfo: IKeyChainRequest
): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const chainStages = ExportKeys[keyChainInfo.KeyChain]?.chainStages;

    if (chainStages) {
        if (chainStages[keyChainInfo.ChainStage].itemsToGiveWhenTriggered.length > 0) {
            await giveKeyChainItem(inventory, keyChainInfo);
        }

        if (chainStages[keyChainInfo.ChainStage].messageToSendWhenTriggered) {
            await giveKeyChainMessage(inventory, inventory.accountOwnerId, keyChainInfo);
        }
    }
};
