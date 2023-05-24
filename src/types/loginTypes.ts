import { Document } from "mongoose";

export interface ILoginResponse extends Omit<IDatabaseAccountDocument, "email" | "password"> {
    Groups: IGroup[];
    Nonce: number;
    BuildLabel: string;
    MatchmakingBuildId: string;
    platformCDNs: string[];
    NRS: string[];
    DTLS: number;
    IRC: string[];
    HUB: string;
}

//includes virtual id
export interface IDatabaseAccountDocument extends IDatabaseAccount {
    id: string;
}

export interface IGroup {
    experiment: string;
    experimentGroup: string;
}

export interface IDatabaseAccount {
    email: string;
    password: string;
    DisplayName: string;
    CountryCode: string;
    ClientType: string;
    CrossPlatformAllowed: boolean;
    ForceLogoutVersion: number;
    AmazonAuthToken?: string;
    AmazonRefreshToken?: string;
    ConsentNeeded: boolean;
    TrackedSettings: string[];
}

export interface ILoginRequest {
    email: string;
    password: string;
    time: number;
    s: string;
    lang: string;
    date: number;
    ClientType: string;
    PS: string;
}
