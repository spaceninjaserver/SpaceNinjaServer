import { RequestHandler } from "express";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountForRequest } from "@/src/services/loginService";
import { addChallenges, getInventory } from "@/src/services/inventoryService";
import { IChallengeProgress, ISeasonChallenge } from "@/src/types/inventoryTypes/inventoryTypes";
import { IAffiliationMods } from "@/src/types/purchaseTypes";
import { getEntriesUnsafe } from "@/src/utils/ts-utils";
import { logger } from "@/src/utils/logger";

export const updateChallengeProgressController: RequestHandler = async (req, res) => {
    const challenges = getJSONfromString<IUpdateChallengeProgressRequest>(String(req.body));
    const account = await getAccountForRequest(req);

    const inventory = await getInventory(
        account._id.toString(),
        "ChallengesFixVersion ChallengeProgress SeasonChallengeHistory Affiliations CalendarProgress"
    );
    let affiliationMods: IAffiliationMods[] = [];
    if (challenges.ChallengeProgress) {
        affiliationMods = addChallenges(
            account,
            inventory,
            challenges.ChallengeProgress,
            challenges.SeasonChallengeCompletions
        );
    }
    for (const [key, value] of getEntriesUnsafe(challenges)) {
        switch (key) {
            case "ChallengesFixVersion":
                inventory.ChallengesFixVersion = value;
                break;

            case "SeasonChallengeHistory":
                value!.forEach(({ challenge, id }) => {
                    const itemIndex = inventory.SeasonChallengeHistory.findIndex(i => i.challenge === challenge);
                    if (itemIndex !== -1) {
                        inventory.SeasonChallengeHistory[itemIndex].id = id;
                    } else {
                        inventory.SeasonChallengeHistory.push({ challenge, id });
                    }
                });
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
    crossPlaySetting?: string;
}
