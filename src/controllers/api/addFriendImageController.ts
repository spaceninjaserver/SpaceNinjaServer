import type { RequestHandler } from "express";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { Inventory } from "../../models/inventoryModels/inventoryModel.ts";

export const addFriendImageController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const json = getJSONfromString<IUpdateGlyphRequest>(String(req.body));

    await Inventory.updateOne(
        {
            accountOwnerId: accountId
        },
        {
            ActiveAvatarImageType: json.AvatarImageType
        }
    );

    res.json({});
};

interface IUpdateGlyphRequest {
    AvatarImageType: string;
    AvatarImage: string;
}
