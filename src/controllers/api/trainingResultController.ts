import { buildVersionToInt, getAccountForRequest, type TAccountDocument } from "../../services/loginService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getInventory } from "../../services/inventoryService.ts";
import type { IMongoDateWithLegacySupport } from "../../types/commonTypes.ts";
import type { RequestHandler } from "express";
import { unixTimesInMs } from "../../constants/timeConstants.ts";
import type { IInventoryChanges } from "../../types/purchaseTypes.ts";
import { createMessage } from "../../services/inboxService.ts";
import { toMongoDate2 } from "../../helpers/inventoryHelpers.ts";
import gameToBuildVersion from "../../constants/gameToBuildVersion.ts";

interface ITrainingResultsRequest {
    numLevelsGained: number;
}

interface ITrainingResultsResponse {
    NewTrainingDate: IMongoDateWithLegacySupport;
    NewLevel: number;
    InventoryChanges: IInventoryChanges;
}

const handleTrainingProgress = async (
    account: TAccountDocument,
    numLevelsGained: number
): Promise<ITrainingResultsResponse> => {
    const inventory = await getInventory(
        account._id,
        "TrainingDate PlayerLevel TradesRemaining noMasteryRankUpCooldown"
    );

    if (numLevelsGained === 1) {
        let time = Date.now();
        if (!inventory.noMasteryRankUpCooldown) {
            time += unixTimesInMs.hour * 23;
        }
        inventory.TrainingDate = new Date(time);

        inventory.PlayerLevel += 1;
        inventory.TradesRemaining += 1;

        if (inventory.PlayerLevel == 2) {
            await createMessage(account._id, [
                {
                    sndr: "/Lotus/Language/Game/Maroo",
                    msg: "/Lotus/Language/Clan/MarooClanSearchDesc",
                    sub: "/Lotus/Language/Clan/MarooClanSearchTitle",
                    icon: "/Lotus/Interface/Icons/Npcs/Maroo.png"
                }
            ]);
        }

        await createMessage(account._id, [
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
                highPriority: true,
                minBuildVersion: buildVersionToInt(gameToBuildVersion["29.5.0"])
            }
        ]);
    }

    const changedinventory = await inventory.save();

    return {
        NewTrainingDate: toMongoDate2(changedinventory.TrainingDate, account.BuildLabel),
        NewLevel: numLevelsGained == 1 ? changedinventory.PlayerLevel : inventory.PlayerLevel,
        InventoryChanges: {}
    };
};

export const trainingResultPostController: RequestHandler = async (req, res): Promise<void> => {
    const account = await getAccountForRequest(req);
    const { numLevelsGained } = getJSONfromString<ITrainingResultsRequest>(String(req.body));

    const response = await handleTrainingProgress(account, numLevelsGained);
    res.json(response satisfies ITrainingResultsResponse);
};

export const trainingResultGetController: RequestHandler = async (req, res): Promise<void> => {
    const account = await getAccountForRequest(req);
    const numLevelsGained = Number(req.query.numLevelsGained ?? 0);

    const response = await handleTrainingProgress(account, numLevelsGained);
    res.json(response satisfies ITrainingResultsResponse);
};
