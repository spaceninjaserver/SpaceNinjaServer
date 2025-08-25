import type { RequestHandler } from "express";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountForRequest } from "@/src/services/loginService";
import { addCalendarProgress, addChallenges, getInventory } from "@/src/services/inventoryService";
import type { IChallengeProgress, ISeasonChallenge } from "@/src/types/inventoryTypes/inventoryTypes";
import type { IAffiliationMods } from "@/src/types/purchaseTypes";
import { getEntriesUnsafe } from "@/src/utils/ts-utils";
import { logger } from "@/src/utils/logger";

export const updateChallengeProgressController: RequestHandler = async (req, res) => {
    const challenges = getJSONfromString<IUpdateChallengeProgressRequest>(String(req.body));
    const account = await getAccountForRequest(req);
    logger.debug(`challenge report:`, challenges);

    const inventory = await getInventory(
        account._id.toString(),
        "ChallengesFixVersion ChallengeProgress SeasonChallengeHistory Affiliations CalendarProgress"
    );
    let affiliationMods: IAffiliationMods[] = [];
    if (challenges.ChallengeProgress) {
        affiliationMods = await addChallenges(
            account,
            inventory,
            challenges.ChallengeProgress,
            challenges.SeasonChallengeCompletions
        );
    }
    for (const [key, value] of getEntriesUnsafe(challenges)) {
        if (value === undefined) {
            logger.error(`Challenge progress update key ${key} has no value`);
            continue;
        }
        switch (key) {
            case "ChallengesFixVersion":
                inventory.ChallengesFixVersion = value;
                break;

            case "SeasonChallengeHistory":
                value.forEach(({ challenge, id }) => {
                    const itemIndex = inventory.SeasonChallengeHistory.findIndex(i => i.challenge === challenge);
                    if (itemIndex !== -1) {
                        inventory.SeasonChallengeHistory[itemIndex].id = id;
                    } else {
                        inventory.SeasonChallengeHistory.push({ challenge, id });
                    }
                });
                break;

            case "CalendarProgress":
                addCalendarProgress(inventory, value);
                break;

            case "ChallengeProgress":
            case "SeasonChallengeCompletions":
            case "ChallengePTS":
            case "crossPlaySetting":
                break;
            default:
                logger.warn(`unknown challenge progress entry`, { key, value });
        }
    }
    await inventory.save();

    res.json({
        AffiliationMods: affiliationMods
    });
};

interface IUpdateChallengeProgressRequest {
    ChallengePTS?: number;
    ChallengesFixVersion?: number;
    ChallengeProgress?: IChallengeProgress[];
    SeasonChallengeHistory?: ISeasonChallenge[];
    SeasonChallengeCompletions?: ISeasonChallenge[];
    CalendarProgress?: { challenge: string }[];
    crossPlaySetting?: string;
}
