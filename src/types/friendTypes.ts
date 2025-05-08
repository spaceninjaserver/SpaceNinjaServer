import { Types } from "mongoose";
import { IMongoDate, IOid } from "./commonTypes";

export interface IFriendInfo {
    _id: IOid;
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
