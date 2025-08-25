import type { RequestHandler } from "express";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { Inventory } from "@/src/models/inventoryModels/inventoryModel";

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
