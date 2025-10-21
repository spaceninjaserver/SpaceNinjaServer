import type { RequestHandler } from "express";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import { addCalendarProgress, addChallenges, getInventory } from "../../services/inventoryService.ts";
import type { IChallengeProgress, ISeasonChallenge } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { IAffiliationMods } from "../../types/purchaseTypes.ts";
import { getEntriesUnsafe } from "../../utils/ts-utils.ts";
import { logger } from "../../utils/logger.ts";

export const updateChallengeProgressController: RequestHandler = async (req, res) => {
    const challenges = getJSONfromString<IUpdateChallengeProgressRequest>(String(req.body));
    const account = await getAccountForRequest(req);
    logger.debug(`challenge report:`, challenges);

    const inventory = await getInventory(
        account._id.toString(),
        "ChallengesFixVersion ChallengeProgress SeasonChallengeHistory Affiliations CalendarProgress nightwaveStandingMultiplier"
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
