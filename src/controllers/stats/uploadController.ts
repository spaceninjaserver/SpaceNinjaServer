import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getStats, uploadStats } from "@/src/services/statsService";
import { IStatsUpload } from "@/src/types/statTypes";
import { RequestHandler } from "express";

const uploadController: RequestHandler = async (req, res) => {
    const payload = getJSONfromString<IStatsUpload>(String(req.body));
    const accountId = await getAccountIdForRequest(req);
    const playerStats = await getStats(accountId);
    await uploadStats(playerStats, payload);
    res.status(200).end();
};

export { uploadController };
