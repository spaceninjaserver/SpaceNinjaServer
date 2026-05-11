import { toOid2 } from "../../helpers/inventoryHelpers.ts";
import { Friendship } from "../../models/friendModel.ts";
import { Inventory } from "../../models/inventoryModels/inventoryModel.ts";
import { addAccountDataToFriendInfo, addInventoryDataToFriendInfo } from "../../services/friendService.ts";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import type { IFriendInfo } from "../../types/friendTypes.ts";
import type { Request, RequestHandler, Response } from "express";
import { getObjectValues } from "../../utils/ts-utils.ts";

// POST with {} instead of GET as of 38.5.0
export const getFriendsController: RequestHandler = async (req: Request, res: Response) => {
    const account = await getAccountForRequest(req);
    const buildLabel = getBuildLabel(req, account);
    const response: IGetFriendsResponse = {
        ActiveAvatarImageType: (await Inventory.findOne({ accountOwnerId: account._id }, "ActiveAvatarImageType"))
            ?.ActiveAvatarImageType,
        Current: [],
        IncomingFriendRequests: [],
        OutgoingFriendRequests: []
    };
    const [internalFriendships, externalFriendships] = await Promise.all([
        Friendship.find({ owner: account._id }),
        Friendship.find({ friend: account._id }, "owner Note NewRequest")
    ]);
    for (const externalFriendship of externalFriendships) {
        if (!internalFriendships.find(x => x.friend.equals(externalFriendship.owner))) {
            response.IncomingFriendRequests.push({
                _id: toOid2(externalFriendship.owner, buildLabel),
                Note: externalFriendship.Note,
                NewRequest: externalFriendship.NewRequest
            });
        }
    }
    for (const internalFriendship of internalFriendships) {
        const friendInfo: IFriendInfo = {
            _id: toOid2(internalFriendship.friend, buildLabel)
        };
        if (externalFriendships.find(x => x.owner.equals(internalFriendship.friend))) {
            response.Current.push(friendInfo);
        } else {
            response.OutgoingFriendRequests.push(friendInfo);
        }
    }
    const promises: Promise<void>[] = [];
    for (const arr of getObjectValues(response)) {
        if (Array.isArray(arr)) {
            for (const friendInfo of arr) {
                promises.push(addAccountDataToFriendInfo(friendInfo, buildLabel));
                promises.push(addInventoryDataToFriendInfo(friendInfo));
            }
        }
    }
    await Promise.all(promises);
    res.json(response);
};

interface IGetFriendsResponse {
    ActiveAvatarImageType?: string; // ~U18
    Current: IFriendInfo[];
    IncomingFriendRequests: IFriendInfo[];
    OutgoingFriendRequests: IFriendInfo[];
}
