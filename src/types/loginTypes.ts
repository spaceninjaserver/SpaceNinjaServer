export interface IAccountAndLoginResponseCommons {
    DisplayName: string;
    CountryCode: string;
    ClientType: string;
    CrossPlatformAllowed: boolean;
    ForceLogoutVersion: number;
    AmazonAuthToken?: string;
    AmazonRefreshToken?: string;
    ConsentNeeded: boolean;
    TrackedSettings: string[];
    Nonce: number;
}

export interface IDatabaseAccount extends IAccountAndLoginResponseCommons {
    email: string;
    password: string;
    Dropped?: boolean;
    LatestEventMessageDate: Date;
}

// Includes virtual ID
export interface IDatabaseAccountJson extends IDatabaseAccount {
    id: string;
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
    kick?: boolean;
}

export interface ILoginResponse extends IAccountAndLoginResponseCommons {
    id: string;
    Groups: IGroup[];
    BuildLabel: string;
    MatchmakingBuildId: string;
    platformCDNs?: string[];
    NRS?: string[];
    DTLS: number;
    IRC: string[];
    HUB?: string;
}

export interface IGroup {
    experiment: string;
    experimentGroup: string;
}
