import { RequestHandler } from "express";
import { IChallengeProgress } from "@/src/types/inventoryTypes/inventoryTypes";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory, addChallenges } from "@/src/services/inventoryService";

interface IUpdateChallengeProgessRequest {
    ChallengeProgress: IChallengeProgress[];
}

const updateChallengeProgressController: RequestHandler = async (req, res) => {
    const payload: IUpdateChallengeProgessRequest = getJSONfromString(req.body.toString());
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    addChallenges(inventory, payload.ChallengeProgress);
    inventory.save();
    res.status(200).end();
};

export { updateChallengeProgressController };
