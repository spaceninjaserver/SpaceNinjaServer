import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { Friendship } from "../../models/friendModel.ts";

export const pendingFriendsViewedController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const body = JSON.parse(String(req.body)) as IPendingFriendsViewedRequest;
    for (const friend of body.friends) {
        await Friendship.updateOne({ friend: accountId, owner: friend }, { $unset: { NewRequest: 1 } });
    }
    res.end();
};

interface IPendingFriendsViewedRequest {
    friends: string[];
}
