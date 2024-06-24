import { RequestHandler } from "express";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { updateChallengeProgress } from "@/src/services/inventoryService";
import { IUpdateChallengeProgressRequest } from "@/src/types/requestTypes";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const updateChallengeProgressController: RequestHandler = async (req, res) => {
    const payload = getJSONfromString(String(req.body)) as IUpdateChallengeProgressRequest;
    const accountId = await getAccountIdForRequest(req);

    await updateChallengeProgress(payload, accountId);

    res.status(200).end();
};

export { updateChallengeProgressController };
