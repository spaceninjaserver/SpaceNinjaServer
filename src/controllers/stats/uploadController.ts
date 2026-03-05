import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getAccountForRequest } from "../../services/loginService.ts";
import { updateStats } from "../../services/statsService.ts";
import type { IStatsUpdate } from "../../types/statTypes.ts";
import type { RequestHandler } from "express";

const uploadController: RequestHandler = async (req, res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { PS, ...payload } = getJSONfromString<IStatsUpdate>(String(req.body));
    const account = await getAccountForRequest(req);
    await updateStats(account._id.toString(), payload, account.BuildLabel);
    res.status(200).end();
};

export { uploadController };
