import { RequestHandler } from "express";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IUpdateQuestRequest } from "@/src/types/questTypes";
import { updateQuest } from "@/src/services/questService";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const updateQuestController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const payload = getJSONfromString(String(req.body)) as IUpdateQuestRequest;
    const result = await updateQuest(accountId, payload);
    res.json(result);
};

export { updateQuestController };
