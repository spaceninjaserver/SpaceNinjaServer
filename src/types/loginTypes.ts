import type { Types } from "mongoose";

export interface IAccountAndLoginResponseCommons {
    DisplayName: string;
    CountryCode?: string;
    ClientType?: string;
    CrossPlatformAllowed?: boolean;
    ForceLogoutVersion?: number;
    GoogleTokenId?: string;
    AmazonAuthToken?: string;
    AmazonRefreshToken?: string;
    ConsentNeeded?: boolean;
    TrackedSettings?: string[];
    Nonce: number;
}

export interface IDatabaseAccountRequiredFields extends IAccountAndLoginResponseCommons {
    email: string;
    password: string;
    BuildLabel?: string;
    LastLogin: Date;
}

export interface IDatabaseAccount extends IDatabaseAccountRequiredFields {
    Dropped?: boolean;
    LatestEventMessageDate: Date;
    LastLoginRewardDate: number;
    LoginDays: number;
    DailyFirstWinDate: number;
    receivedEventMessage_creditBoost?: boolean;
    receivedEventMessage_affinityBoost?: boolean;
    receivedEventMessage_resourceBoost?: boolean;
    receivedEventMessage_galleonOfGhouls?: boolean;
}

// Includes virtual ID
export interface IDatabaseAccountJson extends IDatabaseAccount {
    id: string;
}

export interface ILoginRequest {
    email: string;
    password: string;
    time: number;
    s?: string;
    lang?: string;
    date: number;
    ClientType?: string;
    PS?: string;
    GoogleTokenId?: string;
    kick?: boolean;
}

export interface ILoginResponse extends IAccountAndLoginResponseCommons {
    id: string;
    Groups?: IGroup[];
    BuildLabel: string;
    MatchmakingBuildId?: string;
    platformCDNs?: string[];
    NRS?: string[];
    DTLS?: number;
    IRC?: string[];
    HUB?: string;
    NatHash?: string;
    SteamId?: string;
}

export interface IGroup {
    experiment: string;
    experimentGroup: string;
}

export interface IIgnore {
    ignorer: Types.ObjectId;
    ignoree: Types.ObjectId;
}
