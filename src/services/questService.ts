import { IInventoryDatabase, IQuestKeyDatabase } from "@/src/types/inventoryTypes/inventoryTypes";
import { logger } from "@/src/utils/logger";
import { HydratedDocument } from "mongoose";

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

export interface IUpdateQuestRequest {
    QuestKeys: Omit<IQuestKeyDatabase, "CompletionDate">[];
    PS: string;
    questCompletion: boolean;
    PlayerShipEvents: unknown[];
    crossPlaySetting: string;
    DoQuestReward: boolean;
}
