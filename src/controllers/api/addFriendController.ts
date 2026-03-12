import type { Types } from "mongoose";
import { toOid } from "../../helpers/inventoryHelpers.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { Friendship } from "../../models/friendModel.ts";
import { addAccountDataToFriendInfo, addInventoryDataToFriendInfo } from "../../services/friendService.ts";
import { getAccountForRequest, getAccountIdForRequest } from "../../services/loginService.ts";
import type { IFriendInfo } from "../../types/friendTypes.ts";
import type { RequestHandler } from "express";

export const addFriendPostController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const payload = getJSONfromString<IAddFriendRequest>(String(req.body));
    const promises: Promise<void>[] = [];
    const newFriends: IFriendInfo[] = [];
    if (payload.friend == "all") {
        const [internalFriendships, externalFriendships] = await Promise.all([
            Friendship.find({ owner: account._id }, "friend"),
            Friendship.find({ friend: account._id }, "owner")
        ]);
        for (const externalFriendship of externalFriendships) {
            if (!internalFriendships.find(x => x.friend.equals(externalFriendship.owner))) {
                promises.push(
                    Friendship.insertOne({
                        owner: account._id,
                        friend: externalFriendship.owner,
                        Note: externalFriendship.Note // TOVERIFY: Should the note be copied when accepting a friend request?
                    }) as unknown as Promise<void>
                );
                newFriends.push({
                    _id: toOid(externalFriendship.owner)
                });
            }
        }
    } else {
        await acceptFriendRequest(account._id, payload.friend, newFriends);
    }
    for (const newFriend of newFriends) {
        promises.push(addAccountDataToFriendInfo(newFriend, account.BuildLabel));
        promises.push(addInventoryDataToFriendInfo(newFriend));
    }
    await Promise.all(promises);
    res.json({
        Friends: newFriends
    });
};

interface IAddFriendRequest {
    friend: string; // oid or "all" in which case all=1 is also a query parameter
}

export const addFriendGetController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    await acceptFriendRequest(accountId, req.query.friend as string, undefined);
    res.end();
};

const acceptFriendRequest = async (
    accountId: Types.ObjectId | string,
    otherAccountId: string,
    newFriends: IFriendInfo[] | undefined
): Promise<void> => {
    const externalFriendship = await Friendship.findOne(
        { owner: otherAccountId, friend: accountId },
        "Note NewRequest"
    );
    if (externalFriendship) {
        if (externalFriendship.NewRequest) {
            externalFriendship.NewRequest = undefined;
            await externalFriendship.save();
        }
        await Friendship.insertOne({
            owner: accountId,
            friend: otherAccountId,
            Note: externalFriendship.Note
        });
        if (newFriends) {
            newFriends.push({
                _id: { $oid: otherAccountId }
            });
        }
    }
};
