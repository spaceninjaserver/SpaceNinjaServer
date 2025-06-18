import { RequestHandler } from "express";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountForRequest } from "@/src/services/loginService";
import { addChallenges, getInventory } from "@/src/services/inventoryService";
import { IChallengeProgress, ISeasonChallenge } from "@/src/types/inventoryTypes/inventoryTypes";
import { IAffiliationMods } from "@/src/types/purchaseTypes";

export const updateChallengeProgressController: RequestHandler = async (req, res) => {
    const challenges = getJSONfromString<IUpdateChallengeProgressRequest>(String(req.body));
    const account = await getAccountForRequest(req);

    const inventory = await getInventory(
        account._id.toString(),
        "ChallengesFixVersion ChallengeProgress SeasonChallengeHistory Affiliations"
    );
    if (challenges.ChallengesFixVersion !== undefined) {
        inventory.ChallengesFixVersion = challenges.ChallengesFixVersion;
    }
    let affiliationMods: IAffiliationMods[] = [];
    if (challenges.ChallengeProgress) {
        affiliationMods = addChallenges(
            account,
            inventory,
            challenges.ChallengeProgress,
            challenges.SeasonChallengeCompletions
        );
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
    ChallengesFixVersion?: number;
    ChallengeProgress?: IChallengeProgress[];
    SeasonChallengeHistory?: ISeasonChallenge[];
    SeasonChallengeCompletions?: ISeasonChallenge[];
}
