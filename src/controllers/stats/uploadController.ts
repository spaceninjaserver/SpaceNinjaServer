import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { updateStats } from "@/src/services/statsService";
import type { IStatsUpdate } from "@/src/types/statTypes";
import type { RequestHandler } from "express";

const uploadController: RequestHandler = async (req, res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { PS, ...payload } = getJSONfromString<IStatsUpdate>(String(req.body));
    const accountId = await getAccountIdForRequest(req);
    await updateStats(accountId, payload);
    res.status(200).end();
};

export { uploadController };
