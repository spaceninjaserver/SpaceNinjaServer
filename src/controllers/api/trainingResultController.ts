import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getInventory } from "../../services/inventoryService.ts";
import type { IMongoDate } from "../../types/commonTypes.ts";
import type { RequestHandler } from "express";
import { unixTimesInMs } from "../../constants/timeConstants.ts";
import type { IInventoryChanges } from "../../types/purchaseTypes.ts";
import { createMessage } from "../../services/inboxService.ts";

interface ITrainingResultsRequest {
    numLevelsGained: number;
}

interface ITrainingResultsResponse {
    NewTrainingDate: IMongoDate;
    NewLevel: number;
    InventoryChanges: IInventoryChanges;
}

const handleTrainingProgress = async (
    accountId: string,
    numLevelsGained: number
): Promise<ITrainingResultsResponse> => {
    const inventory = await getInventory(accountId, "TrainingDate PlayerLevel TradesRemaining noMasteryRankUpCooldown");

    if (numLevelsGained === 1) {
        let time = Date.now();
        if (!inventory.noMasteryRankUpCooldown) {
            time += unixTimesInMs.hour * 23;
        }
        inventory.TrainingDate = new Date(time);

        inventory.PlayerLevel += 1;
        inventory.TradesRemaining += 1;

        if (inventory.PlayerLevel == 2) {
            await createMessage(accountId, [
                {
                    sndr: "/Lotus/Language/Game/Maroo",
                    msg: "/Lotus/Language/Clan/MarooClanSearchDesc",
                    sub: "/Lotus/Language/Clan/MarooClanSearchTitle",
                    icon: "/Lotus/Interface/Icons/Npcs/Maroo.png"
                }
            ]);
        }

        await createMessage(accountId, [
            {
                sndr: "/Lotus/Language/Menu/Mailbox_WarframeSender",
                msg: "/Lotus/Language/Inbox/MasteryRewardMsg",
                arg: [
                    {
                        Key: "NEW_RANK",
                        Tag: inventory.PlayerLevel
                    }
                ],
                att: [
                    `/Lotus/Types/Items/ShipDecos/MasteryTrophies/Rank${inventory.PlayerLevel.toString().padStart(2, "0")}Trophy`
                ],
                sub: "/Lotus/Language/Inbox/MasteryRewardTitle",
                icon: "/Lotus/Interface/Icons/Npcs/Lotus_d.png",
                highPriority: true
            }
        ]);
    }

    const changedinventory = await inventory.save();

    return {
        NewTrainingDate: {
            $date: { $numberLong: changedinventory.TrainingDate.getTime().toString() }
        },
        NewLevel: numLevelsGained == 1 ? changedinventory.PlayerLevel : inventory.PlayerLevel,
        InventoryChanges: {}
    };
};

export const trainingResultPostController: RequestHandler = async (req, res): Promise<void> => {
    const accountId = await getAccountIdForRequest(req);
    const { numLevelsGained } = getJSONfromString<ITrainingResultsRequest>(String(req.body));

    const response = await handleTrainingProgress(accountId, numLevelsGained);
    res.json(response satisfies ITrainingResultsResponse);
};

export const trainingResultGetController: RequestHandler = async (req, res): Promise<void> => {
    const accountId = await getAccountIdForRequest(req);
    const numLevelsGained = Number(req.query.numLevelsGained ?? 0);

    const response = await handleTrainingProgress(accountId, numLevelsGained);
    res.json(response satisfies ITrainingResultsResponse);
};
