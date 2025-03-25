import { RequestHandler } from "express";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { addChallenges, addSeasonalChallengeHistory, getInventory } from "@/src/services/inventoryService";
import { IChallengeProgress, ISeasonChallenge } from "@/src/types/inventoryTypes/inventoryTypes";
import { ExportNightwave } from "warframe-public-export-plus";
import { logger } from "@/src/utils/logger";
import { IAffiliationMods } from "@/src/types/purchaseTypes";

export const updateChallengeProgressController: RequestHandler = async (req, res) => {
    const challenges = getJSONfromString<IUpdateChallengeProgressRequest>(String(req.body));
    const accountId = await getAccountIdForRequest(req);

    const inventory = await getInventory(accountId, "ChallengeProgress SeasonChallengeHistory Affiliations");
    if (challenges.ChallengeProgress) {
        addChallenges(inventory, challenges.ChallengeProgress);
    }
    if (challenges.SeasonChallengeHistory) {
        addSeasonalChallengeHistory(inventory, challenges.SeasonChallengeHistory);
    }
    const affiliationMods: IAffiliationMods[] = [];
    if (challenges.ChallengeProgress && challenges.SeasonChallengeCompletions) {
        for (const challenge of challenges.SeasonChallengeCompletions) {
            // Ignore challenges that weren't completed just now
            if (!challenges.ChallengeProgress.find(x => challenge.challenge.indexOf(x.Name) != -1)) {
                continue;
            }

            const meta = ExportNightwave.challenges[challenge.challenge];
            logger.debug("Completed challenge", meta);

            let affiliation = inventory.Affiliations.find(x => x.Tag == ExportNightwave.affiliationTag);
            if (!affiliation) {
                affiliation =
                    inventory.Affiliations[
                        inventory.Affiliations.push({
                            Tag: ExportNightwave.affiliationTag,
                            Standing: 0
                        }) - 1
                    ];
            }
            affiliation.Standing += meta.standing;

            if (affiliationMods.length == 0) {
                affiliationMods.push({ Tag: ExportNightwave.affiliationTag });
            }
            affiliationMods[0].Standing ??= 0;
            affiliationMods[0].Standing += meta.standing;
        }
    }
    await inventory.save();

    res.json({
        AffiliationMods: affiliationMods
    });
};

interface IUpdateChallengeProgressRequest {
    ChallengeProgress?: IChallengeProgress[];
    SeasonChallengeHistory?: ISeasonChallenge[];
    SeasonChallengeCompletions?: ISeasonChallenge[];
}
