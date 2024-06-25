import { RequestHandler } from "express";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { giveKeyChainTriggeredItems } from "@/src/services/questService";
import { IGiveKeyChainTriggeredItemsRequest } from "@/src/types/questTypes";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const giveKeyChainTriggeredItemsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const payload = getJSONfromString(req.body as string) as IGiveKeyChainTriggeredItemsRequest;
    const result = await giveKeyChainTriggeredItems(accountId, payload.KeyChain, payload.ChainStage);
    if (result) res.json(result);
    else res.json({});
};

export { giveKeyChainTriggeredItemsController };
