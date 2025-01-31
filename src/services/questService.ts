import { IKeyChainRequest } from "@/src/controllers/api/giveKeyChainTriggeredItemsController";
import { TInventoryDatabaseDocument } from "@/src/models/inventoryModels/inventoryModel";
import { IInventoryDatabase, IQuestKeyDatabase, IQuestStage } from "@/src/types/inventoryTypes/inventoryTypes";
import { logger } from "@/src/utils/logger";
import { HydratedDocument } from "mongoose";

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

    console.log(questKeyUpdate[0]);
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

    if (!questStage) {
        const questStageIndex = quest.Progress.push(questStageUpdate) - 1;
        if (questStageIndex !== ChainStage) {
            throw new Error(`Quest stage index mismatch: ${questStageIndex} !== ${ChainStage}`);
        }
        return;
    }

    Object.assign(questStage, questStageUpdate);
};
