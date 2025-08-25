import { getAccountForRequest } from "@/src/services/loginService";
import type { RequestHandler } from "express";

export const checkDailyMissionBonusController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const today = Math.trunc(Date.now() / 86400000) * 86400;
    if (account.DailyFirstWinDate != today) {
        res.send("DailyMissionBonus:1-DailyPVPWinBonus:1\n");
    } else {
        res.send("DailyMissionBonus:0-DailyPVPWinBonus:1\n");
    }
};
