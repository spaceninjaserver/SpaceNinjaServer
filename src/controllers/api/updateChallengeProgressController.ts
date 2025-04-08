import { RequestHandler } from "express";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { addChallenges, getInventory } from "@/src/services/inventoryService";
import { IChallengeProgress, ISeasonChallenge } from "@/src/types/inventoryTypes/inventoryTypes";
import { IAffiliationMods } from "@/src/types/purchaseTypes";

export const updateChallengeProgressController: RequestHandler = async (req, res) => {
    const challenges = getJSONfromString<IUpdateChallengeProgressRequest>(String(req.body));
    const accountId = await getAccountIdForRequest(req);

    const inventory = await getInventory(accountId, "ChallengeProgress SeasonChallengeHistory Affiliations");
    let affiliationMods: IAffiliationMods[] = [];
    if (challenges.ChallengeProgress) {
        affiliationMods = addChallenges(inventory, challenges.ChallengeProgress, challenges.SeasonChallengeCompletions);
    }
    if (challenges.SeasonChallengeHistory) {
        challenges.SeasonChallengeHistory.forEach(({ challenge, id }) => {
            const itemIndex = inventory.SeasonChallengeHistory.findIndex(i => i.challenge === challenge);
            if (itemIndex !== -1) {
                inventory.SeasonChallengeHistory[itemIndex].id = id;
            } else {
                inventory.SeasonChallengeHistory.push({ challenge, id });
            }
        });
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
