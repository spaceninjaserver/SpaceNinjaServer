import { toOid } from "@/src/helpers/inventoryHelpers";
import { Friendship } from "@/src/models/friendModel";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IOid } from "@/src/types/commonTypes";
import { RequestHandler } from "express";

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
        });
    } else {
        const friendId = req.query.friendId as string;
        await Promise.all([
            Friendship.deleteOne({ owner: accountId, friend: friendId }),
            Friendship.deleteOne({ owner: friendId, friend: accountId })
        ]);
        res.json({
            Friends: [{ $oid: friendId } satisfies IOid]
        });
    }
};
