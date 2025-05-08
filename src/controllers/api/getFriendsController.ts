import { toOid } from "@/src/helpers/inventoryHelpers";
import { Friendship } from "@/src/models/friendModel";
import { addAccountDataToFriendInfo, addInventoryDataToFriendInfo } from "@/src/services/friendService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IFriendInfo } from "@/src/types/friendTypes";
import { Request, RequestHandler, Response } from "express";

// POST with {} instead of GET as of 38.5.0
export const getFriendsController: RequestHandler = async (req: Request, res: Response) => {
    const accountId = await getAccountIdForRequest(req);
    const response: IGetFriendsResponse = {
        Current: [],
        IncomingFriendRequests: [],
        OutgoingFriendRequests: []
    };
    const [internalFriendships, externalFriendships] = await Promise.all([
        Friendship.find({ owner: accountId }),
        Friendship.find({ friend: accountId }, "owner Note")
    ]);
    for (const externalFriendship of externalFriendships) {
        if (!internalFriendships.find(x => x.friend.equals(externalFriendship.owner))) {
            response.IncomingFriendRequests.push({
                _id: toOid(externalFriendship.owner),
                Note: externalFriendship.Note
            });
        }
    }
    for (const internalFriendship of internalFriendships) {
        const friendInfo: IFriendInfo = {
            _id: toOid(internalFriendship.friend)
        };
        if (externalFriendships.find(x => x.owner.equals(internalFriendship.friend))) {
            response.Current.push(friendInfo);
        } else {
            response.OutgoingFriendRequests.push(friendInfo);
        }
    }
    const promises: Promise<void>[] = [];
    for (const arr of Object.values(response)) {
        for (const friendInfo of arr) {
            promises.push(addAccountDataToFriendInfo(friendInfo));
            promises.push(addInventoryDataToFriendInfo(friendInfo));
        }
    }
    await Promise.all(promises);
    res.json(response);
};

// interface IGetFriendsResponse {
//     Current: IFriendInfo[];
//     IncomingFriendRequests: IFriendInfo[];
//     OutgoingFriendRequests: IFriendInfo[];
// }
type IGetFriendsResponse = Record<"Current" | "IncomingFriendRequests" | "OutgoingFriendRequests", IFriendInfo[]>;
