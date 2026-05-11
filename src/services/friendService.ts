import type { IFriendInfo } from "../types/friendTypes.ts";
import { getInventory } from "./inventoryService.ts";
import { Account } from "../models/loginModel.ts";
import type { Types } from "mongoose";
import { Friendship } from "../models/friendModel.ts";
import { fromOid, toMongoDate2 } from "../helpers/inventoryHelpers.ts";
import { getUnicodeName } from "./loginService.ts";

export const addAccountDataToFriendInfo = async (
    info: IFriendInfo,
    buildLabel: string,
    useUnicodeName?: boolean
): Promise<void> => {
    const account = (await Account.findById(
        fromOid(info._id),
        useUnicodeName ? undefined : "DisplayName LastLogin LastPlatform"
    ))!;
    info.DisplayName = useUnicodeName ? getUnicodeName(account, buildLabel) : account.DisplayName;
    info.LastLogin = toMongoDate2(account.LastLogin, buildLabel);
    info.LastPlatform = account.LastPlatform;
};

export const addInventoryDataToFriendInfo = async (info: IFriendInfo): Promise<void> => {
    const inventory = await getInventory(fromOid(info._id), "PlayerLevel ActiveAvatarImageType spoofMasteryRank");
    info.PlayerLevel = inventory.spoofMasteryRank == -1 ? inventory.PlayerLevel : inventory.spoofMasteryRank;
    info.ActiveAvatarImageType = inventory.ActiveAvatarImageType;
    info.TitleType = inventory.TitleType;
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
