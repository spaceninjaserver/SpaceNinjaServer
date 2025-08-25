import type { Types } from "mongoose";
import type { IMongoDate, IOidWithLegacySupport } from "@/src/types/commonTypes";

export interface IFriendInfo {
    _id: IOidWithLegacySupport;
    DisplayName?: string;
    PlatformNames?: string[];
    PlatformAccountId?: string;
    Status?: number;
    ActiveAvatarImageType?: string;
    LastLogin?: IMongoDate;
    PlayerLevel?: number;
    Suffix?: number;
    Note?: string;
    Favorite?: boolean;
    NewRequest?: boolean;
}

export interface IFriendship {
    owner: Types.ObjectId;
    friend: Types.ObjectId;
    Note?: string;
    Favorite?: boolean;
}
