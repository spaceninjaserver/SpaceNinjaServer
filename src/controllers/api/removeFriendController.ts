import { toOid } from "@/src/helpers/inventoryHelpers";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { Friendship } from "@/src/models/friendModel";
import { Account } from "@/src/models/loginModel";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IOid } from "@/src/types/commonTypes";
import { parallelForeach } from "@/src/utils/async-utils";
import { RequestHandler } from "express";
import { Types } from "mongoose";

export const removeFriendGetController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    if (req.query.all) {
        const [internalFriendships, externalFriendships] = await Promise.all([
            Friendship.find({ owner: accountId }, "friend"),
            Friendship.find({ friend: accountId }, "owner")
        ]);
        const promises: Promise<void>[] = [];
        const friends: IOid[] = [];
        for (const externalFriendship of externalFriendships) {
            if (!internalFriendships.find(x => x.friend.equals(externalFriendship.owner))) {
                promises.push(Friendship.deleteOne({ _id: externalFriendship._id }) as unknown as Promise<void>);
                friends.push(toOid(externalFriendship.owner));
            }
        }
        await Promise.all(promises);
        res.json({
            Friends: friends
        } satisfies IRemoveFriendsResponse);
    } else {
        const friendId = req.query.friendId as string;
        await Promise.all([
            Friendship.deleteOne({ owner: accountId, friend: friendId }),
            Friendship.deleteOne({ owner: friendId, friend: accountId })
        ]);
        res.json({
            Friends: [{ $oid: friendId }]
        } satisfies IRemoveFriendsResponse);
    }
};

export const removeFriendPostController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const data = getJSONfromString<IBatchRemoveFriendsRequest>(String(req.body));
    const friends = new Set((await Friendship.find({ owner: accountId }, "friend")).map(x => x.friend));
    // TOVERIFY: Should pending friendships also be kept?

    // Keep friends that have been online within threshold
    await parallelForeach([...friends], async friend => {
        const account = (await Account.findById(friend, "LastLogin"))!;
        const daysLoggedOut = (Date.now() - account.LastLogin.getTime()) / 86400_000;
        if (daysLoggedOut < data.DaysLoggedOut) {
            friends.delete(friend);
        }
    });

    if (data.SkipClanmates) {
        const inventory = await getInventory(accountId, "GuildId");
        if (inventory.GuildId) {
            await parallelForeach([...friends], async friend => {
                const friendInventory = await getInventory(friend.toString(), "GuildId");
                if (friendInventory.GuildId?.equals(inventory.GuildId)) {
                    friends.delete(friend);
                }
            });
        }
    }

    // Remove all remaining friends that aren't in SkipFriendIds & give response.
    const promises = [];
    const response: IOid[] = [];
    for (const friend of friends) {
        if (!data.SkipFriendIds.find(skipFriendId => checkFriendId(skipFriendId, friend))) {
            promises.push(Friendship.deleteOne({ owner: accountId, friend: friend }));
            promises.push(Friendship.deleteOne({ owner: friend, friend: accountId }));
            response.push(toOid(friend));
        }
    }
    await Promise.all(promises);
    res.json({
        Friends: response
    } satisfies IRemoveFriendsResponse);
};

// The friend ids format is a bit weird, e.g. when 6633b81e9dba0b714f28ff02 (A) is friends with 67cdac105ef1f4b49741c267 (B), A's friend id for B is 808000105ef1f40560ca079e and B's friend id for A is 8000b81e9dba0b06408a8075.
const checkFriendId = (friendId: string, b: Types.ObjectId): boolean => {
    return friendId.substring(6, 6 + 8) == b.toString().substring(6, 6 + 8);
};

interface IBatchRemoveFriendsRequest {
    DaysLoggedOut: number;
    SkipClanmates: boolean;
    SkipFriendIds: string[];
}

interface IRemoveFriendsResponse {
    Friends: IOid[];
}
