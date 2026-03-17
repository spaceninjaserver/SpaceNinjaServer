import { toMongoDate2, toOid2, version_compare } from "../../helpers/inventoryHelpers.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { Friendship } from "../../models/friendModel.ts";
import { Account } from "../../models/loginModel.ts";
import { addInventoryDataToFriendInfo, areFriendsOfFriends } from "../../services/friendService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountForRequest, getUnicodeName, type TAccountDocument } from "../../services/loginService.ts";
import type { IFriendInfo } from "../../types/friendTypes.ts";
import type { RequestHandler, Response } from "express";
import { logger } from "../../utils/logger.ts";
import gameToBuildVersion from "../../constants/gameToBuildVersion.ts";

export const addPendingFriendPostController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const payload = getJSONfromString<IAddPendingFriendRequest>(String(req.body));
    await sendFriendRequest(account, payload.friend, payload.message, res);
};

interface IAddPendingFriendRequest {
    friend: string;
    message: string;
}

export const addPendingFriendGetController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    await sendFriendRequest(account, req.query.friend as string, undefined, res);
};

const sendFriendRequest = async (
    requesterAccount: TAccountDocument,
    name: string,
    message: string | undefined,
    res: Response
): Promise<void> => {
    const requesteeAccount = await Account.findOne({ DisplayName: name });
    if (!requesteeAccount) {
        res.status(400).send("Given Username does not exist.");
        return;
    }

    const requesteeInventory = await getInventory(requesteeAccount._id, "Settings");
    if (
        requesteeInventory.Settings?.FriendInvRestriction == "GIFT_MODE_NONE" ||
        (requesteeInventory.Settings?.FriendInvRestriction == "GIFT_MODE_FRIENDS" &&
            !(await areFriendsOfFriends(requesteeAccount._id, requesterAccount._id)))
    ) {
        res.status(400).send("Friend Invite Restriction");
        return;
    }

    try {
        await Friendship.insertOne({
            owner: requesterAccount._id,
            friend: requesteeAccount._id,
            Note: message,
            NewRequest: true
        });
    } catch (e) {
        logger.debug(`friend request failed due to ${String(e)}`);
        res.status(400).send(`user ${name} already in friend list`);
        return;
    }

    if (
        !requesterAccount.BuildLabel ||
        version_compare(requesterAccount.BuildLabel, gameToBuildVersion["13.0.0"]) >= 0
    ) {
        const friendInfo: IFriendInfo = {
            _id: toOid2(requesteeAccount._id, requesterAccount.BuildLabel),
            DisplayName: getUnicodeName(requesteeAccount, requesterAccount.BuildLabel),
            LastLogin: toMongoDate2(requesteeAccount.LastLogin, requesterAccount.BuildLabel),
            Note: message
        };
        await addInventoryDataToFriendInfo(friendInfo);
        res.json({
            Friend: friendInfo
        });
    } else {
        res.send(requesteeAccount._id.toString());
    }
};
