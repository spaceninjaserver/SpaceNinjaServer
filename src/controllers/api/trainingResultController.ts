import { getAccountForRequest, type TAccountDocument, getBuildVersion } from "../../services/loginService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getInventory } from "../../services/inventoryService.ts";
import type { IMongoDateWithLegacySupport } from "../../types/commonTypes.ts";
import type { RequestHandler } from "express";
import { unixTimesInMs } from "../../constants/timeConstants.ts";
import type { IInventoryChanges } from "../../types/purchaseTypes.ts";
import { createMessage } from "../../services/inboxService.ts";
import { toMongoDate2 } from "../../helpers/inventoryHelpers.ts";
import { shouldDoServerQol } from "../../services/configService.ts";
import gameToBuildVersionInt from "../../constants/gameToBuildVersionInt.ts";
import { addQuestKey } from "../../services/questService.ts";

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
    buildVersion: number,
    numLevelsGained: number
): Promise<ITrainingResultsResponse> => {
    const inventory = await getInventory(
        account._id,
        "TrainingDate PlayerLevel TradesRemaining QuestKeys noMasteryRankUpCooldown"
    );

    if (numLevelsGained === 1) {
        let time = Date.now();
        if (!inventory.noMasteryRankUpCooldown) {
            time +=
                unixTimesInMs.hour *
                (shouldDoServerQol("twentythreeHourMasteryRankCooldown", buildVersion, gameToBuildVersionInt["38.0.0"])
                    ? 23
                    : 24);
        }
        inventory.TrainingDate = new Date(time);

        inventory.PlayerLevel += 1;
        inventory.TradesRemaining += 1;

        // Some quest keys are awarded via Mastery Rank in pre-Specters of the Rail builds, handle that here.
        if (buildVersion < gameToBuildVersionInt["18.16.0"] && buildVersion >= gameToBuildVersionInt["15.0.0"]) {
            if (inventory.PlayerLevel >= 2) {
                if (!inventory.QuestKeys.some(q => q.ItemType.endsWith("ArchwingQuestKeyChain"))) {
                    addQuestKey(inventory, { ItemType: "/Lotus/Types/Keys/ArchwingQuest/ArchwingQuestKeyChain" });
                }
            }

            if (inventory.PlayerLevel >= 3 && buildVersion >= gameToBuildVersionInt["15.13.0"]) {
                if (!inventory.QuestKeys.some(q => q.ItemType.endsWith("SpyQuestKeyChain"))) {
                    addQuestKey(inventory, { ItemType: "/Lotus/Types/Keys/SpyQuestKeyChain/SpyQuestKeyChain" });
                }
            }
        }

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
                minBuildVersion: gameToBuildVersionInt["29.5.0"]
            }
        ]);
    }

    const changedinventory = await inventory.save();

    return {
        NewTrainingDate: toMongoDate2(changedinventory.TrainingDate, buildVersion),
        NewLevel: numLevelsGained == 1 ? changedinventory.PlayerLevel : inventory.PlayerLevel,
        InventoryChanges: {}
    };
};

export const trainingResultPostController: RequestHandler = async (req, res): Promise<void> => {
    const account = await getAccountForRequest(req);
    const buildVersion = getBuildVersion(req, account);
    const { numLevelsGained } = getJSONfromString<ITrainingResultsRequest>(String(req.body));

    const response = await handleTrainingProgress(account, buildVersion, numLevelsGained);
    res.json(response satisfies ITrainingResultsResponse);
};

export const trainingResultGetController: RequestHandler = async (req, res): Promise<void> => {
    const account = await getAccountForRequest(req);
    const buildVersion = getBuildVersion(req, account);
    const numLevelsGained = Number(req.query.numLevelsGained ?? 0);

    const response = await handleTrainingProgress(account, buildVersion, numLevelsGained);
    res.json(response satisfies ITrainingResultsResponse);
};
