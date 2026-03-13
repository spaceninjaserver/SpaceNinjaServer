import type { Types } from "mongoose";
import type { IMongoDateWithLegacySupport, IOidWithLegacySupport } from "./commonTypes.ts";
import type { Platform } from "./loginTypes.ts";

export interface IFriendInfo {
    _id: IOidWithLegacySupport;
    DisplayName?: string;
    PlatformNames?: string[];
    PlatformAccountId?: string;
    Status?: number;
    ActiveAvatarImageType?: string;
    TitleType?: string;
    LastLogin?: IMongoDateWithLegacySupport;
    PlayerLevel?: number;
    Suffix?: number;
    Note?: string;
    Favorite?: boolean;
    NewRequest?: boolean;
    LastPlatform?: Platform;
}

export interface IFriendship {
    owner: Types.ObjectId;
    friend: Types.ObjectId;
    Note?: string;
    Favorite?: boolean;
    NewRequest?: true;
}
