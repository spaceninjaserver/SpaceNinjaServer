import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getInventory2, processGoalProgressUpdates } from "../../services/inventoryService.ts";
import { getAccountForRequest, getBuildVersion } from "../../services/loginService.ts";
import type { RequestHandler } from "express";
import type { IGoalsProgress } from "../../types/requestTypes.ts";

export const goalsController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const buildVersion = getBuildVersion(req, account);
    const inventory = await getInventory2(account._id, "PersonalGoalProgress", "GuildId");
    const payload = getJSONfromString<IGoalsRequest>(String(req.body));

    await processGoalProgressUpdates(inventory, account, buildVersion, payload.Progress);
    await inventory.save();

    res.status(200).end();
};

interface IGoalsRequest {
    Progress: IGoalsProgress[];
}
