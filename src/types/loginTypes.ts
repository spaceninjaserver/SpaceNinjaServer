import type { Types } from "mongoose";

export const ePlatform = {
    Windows: 0,
    PlayStation: 1,
    Xbox: 2,
    Switch: 3,
    iOS: 4,
    Android: 5
} as const;
export type TPlatform = (typeof ePlatform)[keyof typeof ePlatform];

export interface IAccountAndLoginResponseCommons {
    DisplayName: string;
    CountryCode?: string;
    ClientType?: string;
    CrossPlatformAllowed?: boolean;
    ForceLogoutVersion?: number;
    GoogleTokenId?: string;
    ConsentNeeded?: boolean;
    TrackedSettings?: string[];
    Nonce: number;
}

export interface IAccountCreationData extends IAccountAndLoginResponseCommons {
    email: string;
    password: string;
    Language?: string;
    BuildLabel?: string;
    LastLogin: Date;
}

export interface IDatabaseAccount extends IAccountCreationData {
    LastPlatform?: TPlatform;
    Dropped?: true;
    LatestEventMessageDate: Date;
    LastLoginRewardDate: number;
    LoginDays: number;
    DailyFirstWinDate: number;
    receivedEventMessage_creditBoost?: boolean;
    receivedEventMessage_affinityBoost?: boolean;
    receivedEventMessage_resourceBoost?: boolean;
    receivedEventMessage_galleonOfGhouls?: boolean;
    receivedEventMessage_bloodOfPerita?: boolean;
    receivedEventMessage_longShadow?: boolean;
    receivedEventMessage_operationAtramentum?: boolean;
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
    lang?: string; // >= U17
    date: number;
    ClientType?: string;
    PS?: string;
    GoogleTokenId?: string;
    kick?: boolean;
}

export interface ILoginResponse extends IAccountAndLoginResponseCommons {
    id: string;
    Groups?: IGroup[];
    BuildLabel?: string;
    MatchmakingBuildId?: string;
    platformCDNs?: string[];
    NRS?: string[];
    DTLS?: number;
    IRC?: string[];
    HUB?: string;
    NatHash?: string;
    SteamId?: string;
    AmazonAuthToken?: string;
    AmazonRefreshToken?: string;
    Token?: string;
    TokenTTL?: number;
}

export interface IGroup {
    experiment: string;
    experimentGroup: string;
}

export interface IIgnore {
    ignorer: Types.ObjectId;
    ignoree: Types.ObjectId;
}

export interface IAndroidAccount {
    email?: string;
    userId: string;
}
