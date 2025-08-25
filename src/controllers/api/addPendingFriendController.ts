import { toMongoDate, toOid } from "@/src/helpers/inventoryHelpers";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { Friendship } from "@/src/models/friendModel";
import { Account } from "@/src/models/loginModel";
import { addInventoryDataToFriendInfo, areFriendsOfFriends } from "@/src/services/friendService";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import type { IFriendInfo } from "@/src/types/friendTypes";
import type { RequestHandler } from "express";

export const addPendingFriendController: RequestHandler = async (req, res) => {
    const payload = getJSONfromString<IAddPendingFriendRequest>(String(req.body));

    const account = await Account.findOne({ DisplayName: payload.friend });
    if (!account) {
        res.status(400).end();
        return;
    }

    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(account._id.toString(), "Settings");
    if (
        inventory.Settings?.FriendInvRestriction == "GIFT_MODE_NONE" ||
        (inventory.Settings?.FriendInvRestriction == "GIFT_MODE_FRIENDS" &&
            !(await areFriendsOfFriends(account._id, accountId)))
    ) {
        res.status(400).send("Friend Invite Restriction");
        return;
    }

    await Friendship.insertOne({
        owner: accountId,
        friend: account._id,
        Note: payload.message
    });

    const friendInfo: IFriendInfo = {
        _id: toOid(account._id),
        DisplayName: account.DisplayName,
        LastLogin: toMongoDate(account.LastLogin),
        Note: payload.message
    };
    await addInventoryDataToFriendInfo(friendInfo);
    res.json({
        Friend: friendInfo
    });
};

interface IAddPendingFriendRequest {
    friend: string;
    message: string;
}
