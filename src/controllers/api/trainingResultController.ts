import { getAccountIdForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getInventory } from "@/src/services/inventoryService";
import { IMongoDate } from "@/src/types/commonTypes";
import { RequestHandler } from "express";
import { unixTimesInMs } from "@/src/constants/timeConstants";
import { IInventoryChanges } from "@/src/types/purchaseTypes";
import { createMessage } from "@/src/services/inboxService";
import { config } from "@/src/services/configService";

interface ITrainingResultsRequest {
    numLevelsGained: number;
}

interface ITrainingResultsResponse {
    NewTrainingDate: IMongoDate;
    NewLevel: number;
    InventoryChanges: IInventoryChanges;
}

const trainingResultController: RequestHandler = async (req, res): Promise<void> => {
    const accountId = await getAccountIdForRequest(req);

    const trainingResults = getJSONfromString<ITrainingResultsRequest>(String(req.body));

    const inventory = await getInventory(accountId, "TrainingDate PlayerLevel TradesRemaining");

    if (trainingResults.numLevelsGained == 1) {
        let time = Date.now();
        if (!config.noMasteryRankUpCooldown) {
            time += unixTimesInMs.hour * 23;
        }
        inventory.TrainingDate = new Date(time);

        inventory.PlayerLevel += 1;
        inventory.TradesRemaining += 1;

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

    res.json({
        NewTrainingDate: {
            $date: { $numberLong: changedinventory.TrainingDate.getTime().toString() }
        },
        NewLevel: trainingResults.numLevelsGained == 1 ? changedinventory.PlayerLevel : inventory.PlayerLevel,
        InventoryChanges: {}
    } satisfies ITrainingResultsResponse);
};

export { trainingResultController };
