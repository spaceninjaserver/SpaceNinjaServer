export interface ILoginResponse extends Omit<IDatabaseAccountDocument, "email" | "password"> {
    BuildLabel?: string;
    NatHash?: string;
    SteamId?: string;
}

// Includes virtual ID
export interface IDatabaseAccountDocument extends IDatabaseAccount {
    id: string;
}

export interface IGroup {
    experiment: string;
    experimentGroup: string;
}

export interface IDatabaseAccount {
    email?: string;
    password: string;
    DisplayName?: string;
    Nonce?: number;
}

export interface ILoginRequest {
    email: string;
    password: string;
    ClientType?: string;
}
