import type { IFriendInfo } from "@/src/types/friendTypes";
import { getInventory } from "@/src/services/inventoryService";
import { config } from "@/src/services/configService";
import { Account } from "@/src/models/loginModel";
import type { Types } from "mongoose";
import { Friendship } from "@/src/models/friendModel";
import { fromOid, toMongoDate } from "@/src/helpers/inventoryHelpers";

export const addAccountDataToFriendInfo = async (info: IFriendInfo): Promise<void> => {
    const account = (await Account.findById(fromOid(info._id), "DisplayName LastLogin"))!;
    info.DisplayName = account.DisplayName;
    info.LastLogin = toMongoDate(account.LastLogin);
};

export const addInventoryDataToFriendInfo = async (info: IFriendInfo): Promise<void> => {
    const inventory = await getInventory(fromOid(info._id), "PlayerLevel ActiveAvatarImageType");
    info.PlayerLevel = config.spoofMasteryRank == -1 ? inventory.PlayerLevel : config.spoofMasteryRank;
    info.ActiveAvatarImageType = inventory.ActiveAvatarImageType;
};

export const areFriends = async (a: Types.ObjectId | string, b: Types.ObjectId | string): Promise<boolean> => {
    const [aAddedB, bAddedA] = await Promise.all([
        Friendship.exists({ owner: a, friend: b }),
        Friendship.exists({ owner: b, friend: a })
    ]);
    return Boolean(aAddedB && bAddedA);
};

export const areFriendsOfFriends = async (a: Types.ObjectId | string, b: Types.ObjectId | string): Promise<boolean> => {
    const [aInternalFriends, bInternalFriends] = await Promise.all([
        Friendship.find({ owner: a }),
        Friendship.find({ owner: b })
    ]);
    for (const aInternalFriend of aInternalFriends) {
        if (bInternalFriends.find(x => x.friend.equals(aInternalFriend.friend))) {
            const c = aInternalFriend.friend;
            const [cAcceptedA, cAcceptedB] = await Promise.all([
                Friendship.exists({ owner: c, friend: a }),
                Friendship.exists({ owner: c, friend: b })
            ]);
            if (cAcceptedA && cAcceptedB) {
                return true;
            }
        }
    }
    return false;
};
