import { RequestHandler } from "express";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { addChallenges, addSeasonalChallengeHistory, getInventory } from "@/src/services/inventoryService";
import { IChallengeProgress, ISeasonChallenge } from "@/src/types/inventoryTypes/inventoryTypes";

export const updateChallengeProgressController: RequestHandler = async (req, res) => {
    const challenges = getJSONfromString<IUpdateChallengeProgressRequest>(String(req.body));
    const accountId = await getAccountIdForRequest(req);

    const inventory = await getInventory(accountId, "ChallengeProgress SeasonChallengeHistory");
    addChallenges(inventory, challenges.ChallengeProgress);
    addSeasonalChallengeHistory(inventory, challenges.SeasonChallengeHistory);
    await inventory.save();

    res.status(200).end();
};

interface IUpdateChallengeProgressRequest {
    ChallengeProgress: IChallengeProgress[];
    SeasonChallengeHistory: ISeasonChallenge[];
    SeasonChallengeCompletions: ISeasonChallenge[];
}
