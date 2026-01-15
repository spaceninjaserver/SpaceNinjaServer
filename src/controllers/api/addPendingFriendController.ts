import { toMongoDate, toOid } from "../../helpers/inventoryHelpers.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { Friendship } from "../../models/friendModel.ts";
import { Account } from "../../models/loginModel.ts";
import { addInventoryDataToFriendInfo, areFriendsOfFriends } from "../../services/friendService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { IFriendInfo } from "../../types/friendTypes.ts";
import type { RequestHandler, Response } from "express";
import { logger } from "../../utils/logger.ts";

export const addPendingFriendPostController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const payload = getJSONfromString<IAddPendingFriendRequest>(String(req.body));
    await sendFriendRequest(accountId, payload.friend, payload.message, res);
};

interface IAddPendingFriendRequest {
    friend: string;
    message: string;
}

export const addPendingFriendGetController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    await sendFriendRequest(accountId, req.query.friend as string, undefined, res);
};

const sendFriendRequest = async (
    accountId: string,
    name: string,
    message: string | undefined,
    res: Response
): Promise<void> => {
    const account = await Account.findOne({ DisplayName: name });
    if (!account) {
        res.status(400).end();
        return;
    }

    const inventory = await getInventory(account._id.toString(), "Settings");
    if (
        inventory.Settings?.FriendInvRestriction == "GIFT_MODE_NONE" ||
        (inventory.Settings?.FriendInvRestriction == "GIFT_MODE_FRIENDS" &&
            !(await areFriendsOfFriends(account._id, accountId)))
    ) {
        res.status(400).send("Friend Invite Restriction");
        return;
    }

    try {
        await Friendship.insertOne({
            owner: accountId,
            friend: account._id,
            Note: message
        });
    } catch (e) {
        logger.debug(`friend request failed due to ${String(e)}`);
        res.status(400).send(`user ${name} already in friend list`);
        return;
    }

    const friendInfo: IFriendInfo = {
        _id: toOid(account._id),
        DisplayName: account.DisplayName,
        LastLogin: toMongoDate(account.LastLogin),
        Note: message
    };
    await addInventoryDataToFriendInfo(friendInfo);
    res.json({
        Friend: friendInfo
    });
};
