import { RequestHandler } from "express";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IQuestKeyDatabase } from "@/src/types/inventoryTypes/inventoryTypes";
import { logger } from "@/src/utils/logger";
import { Inventory } from "@/src/models/inventoryModels/inventoryModel";

export interface IUpdateQuestRequest {
    QuestKeys: IQuestKeyDatabase[];
    PS: string;
    questCompletion: boolean;
    PlayerShipEvents: [];
    crossPlaySetting: string;
}

export interface IUpdateQuestResponse {
    CustomData?: string;
    MissionRewards: [];
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const updateQuestController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const payload = getJSONfromString(req.body as string) as IUpdateQuestRequest;
    logger.debug("quest: " + payload.QuestKeys[0].ItemType);

    const inventory = await Inventory.findOne({ accountOwnerId: accountId });
    if (inventory) {
        /* empty */
    }

    const result: IUpdateQuestResponse = {
        MissionRewards: []
    };
    res.json(result);
};

export { updateQuestController };
