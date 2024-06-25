import { RequestHandler } from "express";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { giveKeyChainTriggeredMessage } from "@/src/services/questService";
import { IGiveKeyChainTriggeredMessageRequest } from "@/src/types/questTypes";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const giveKeyChainTriggeredMessageController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const payload = getJSONfromString(req.body as string) as IGiveKeyChainTriggeredMessageRequest;
    const result = giveKeyChainTriggeredMessage(accountId, payload.KeyChain, payload.ChainStage);
    if (result != null) res.json(result);
    else res.status(200).end();
};

export { giveKeyChainTriggeredMessageController };
