import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { Inventory } from "../../models/inventoryModels/inventoryModel.ts";

export const addFriendTitleController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const json = getJSONfromString<IUpdateTitleRequest>(String(req.body));

    await Inventory.updateOne(
        {
            accountOwnerId: accountId
        },
        {
            TitleType: json.TitleType
        }
    );

    res.json({});
};

interface IUpdateTitleRequest {
    TitleType: string;
}
