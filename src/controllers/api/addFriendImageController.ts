import { RequestHandler } from "express";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { IUpdateGlyphRequest } from "@/src/types/requestTypes";
import { getInventory } from "@/src/services/inventoryService";

const addFriendImageController: RequestHandler = async (req, res) => {
    const accountId = req.query.accountId as string;
    const json = getJSONfromString(req.body.toString()) as IUpdateGlyphRequest;
    let inventory = await getInventory(accountId);
    inventory.ActiveAvatarImageType = json.AvatarImageType;
    await inventory.save();
    res.json({});
};

export { addFriendImageController };
