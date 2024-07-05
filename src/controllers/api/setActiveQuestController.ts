import { getAccountIdForRequest } from "@/src/services/loginService";
import { setActiveQuest } from "@/src/services/questService";
import { RequestHandler } from "express";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const setActiveQuestController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const quest = req.query.quest as string;
    const result = await setActiveQuest(accountId, quest);
    res.json(result);
};

export { setActiveQuestController };
