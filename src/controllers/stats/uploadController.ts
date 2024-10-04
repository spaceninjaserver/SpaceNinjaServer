import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { uploadStats } from "@/src/services/statsService";
import { IStatsUpload } from "@/src/types/statTypes";
import { RequestHandler } from "express";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const uploadController: RequestHandler = async (req, res) => {
    const payload = getJSONfromString(String(req.body)) as IStatsUpload;
    const accountId = await getAccountIdForRequest(req);
    await uploadStats(accountId, payload);
    res.status(200).end();
};

export { uploadController };
