import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getStats, updateStats } from "@/src/services/statsService";
import { IStatsUpdate } from "@/src/types/statTypes";
import { RequestHandler } from "express";

const uploadController: RequestHandler = async (req, res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { PS, ...payload } = getJSONfromString<IStatsUpdate>(String(req.body));
    const accountId = await getAccountIdForRequest(req);
    const playerStats = await getStats(accountId);
    await updateStats(playerStats, payload);
    res.status(200).end();
};

export { uploadController };
