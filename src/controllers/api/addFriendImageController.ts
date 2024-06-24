import { RequestHandler } from "express";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { IUpdateGlyphRequest } from "@/src/types/requestTypes";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const addFriendImageController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const json = getJSONfromString(String(req.body)) as IUpdateGlyphRequest;
    const inventory = await getInventory(accountId);
    inventory.ActiveAvatarImageType = json.AvatarImageType;
    await inventory.save();
    res.json({});
};

export { addFriendImageController };
