import { IAccountCreation } from "@/src/types/customTypes";
import { IDatabaseAccount } from "@/src/types/loginTypes";
import crypto from "crypto";
import { isString, parseEmail, parseString } from "../general";

const getWhirlpoolHash = (rawPassword: string): string => {
    const whirlpool = crypto.createHash("whirlpool");
    const data = whirlpool.update(rawPassword, "utf8");
    const hash = data.digest("hex");
    return hash;
};

const parsePassword = (passwordCandidate: unknown): string => {
    // a different function could be called that checks whether the password has a certain shape
    if (!isString(passwordCandidate)) {
        throw new Error("incorrect password format");
    }
    return passwordCandidate;
};

const toAccountCreation = (accountCreation: unknown): IAccountCreation => {
    if (!accountCreation || typeof accountCreation !== "object") {
        throw new Error("incorrect or missing account creation data");
    }

    if (
        "email" in accountCreation &&
        "password" in accountCreation &&
        "DisplayName" in accountCreation &&
        "CountryCode" in accountCreation
    ) {
        const rawPassword = parsePassword(accountCreation.password);
        return {
            email: parseEmail(accountCreation.email),
            password: getWhirlpoolHash(rawPassword),
            CountryCode: parseString(accountCreation.CountryCode),
            DisplayName: parseString(accountCreation.DisplayName)
        };
    }
    throw new Error("incorrect account creation data: incorrect properties");
};

const toDatabaseAccount = (createAccount: IAccountCreation): IDatabaseAccount => {
    return {
        ...createAccount,
        ClientType: "",
        ConsentNeeded: false,
        CrossPlatformAllowed: true,
        ForceLogoutVersion: 0,
        TrackedSettings: [],
        Nonce: 0
    } satisfies IDatabaseAccount;
};

export { toDatabaseAccount, toAccountCreation as toCreateAccount };
