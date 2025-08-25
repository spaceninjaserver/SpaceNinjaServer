import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { updateStats } from "../../services/statsService.ts";
import type { IStatsUpdate } from "../../types/statTypes.ts";
import type { RequestHandler } from "express";

const uploadController: RequestHandler = async (req, res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { PS, ...payload } = getJSONfromString<IStatsUpdate>(String(req.body));
    const accountId = await getAccountIdForRequest(req);
    await updateStats(accountId, payload);
    res.status(200).end();
};

export { uploadController };
