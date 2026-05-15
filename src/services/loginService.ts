import { Account } from "../models/loginModel.ts";
import { createInventory } from "./inventoryService.ts";
import {
    ePlatform,
    type IAndroidAccount,
    type IDatabaseAccountJson,
    type IAccountCreationData
} from "../types/loginTypes.ts";
import { createShip } from "./shipService.ts";
import type { Document, Types } from "mongoose";
import { Loadout, type TLoadoutDatabaseDocument } from "../models/inventoryModels/loadoutModel.ts";
import { PersonalRooms } from "../models/personalRoomsModel.ts";
import type { Request } from "express";
import { config, configIdToIndexable } from "./configService.ts";
import { createStats } from "./statsService.ts";
import { crc32 } from "node:zlib";
import crypto from "node:crypto";
import { logger } from "../utils/logger.ts";
import { version_compare } from "../helpers/inventoryHelpers.ts";
import gameToBuildVersion from "../constants/gameToBuildVersion.ts";
import { OAuth2Client } from "google-auth-library";
import { BL_LATEST } from "../constants/gameVersions.ts";

export const isCorrectPassword = (requestPassword: string, databasePassword: string): boolean => {
    return requestPassword === databasePassword;
};

export const isNameTaken = async (name: string): Promise<boolean> => {
    return !!(await Account.findOne({ DisplayName: name }));
};

export const isNameReserved = (name: string): boolean => {
    return name == "all";
};

export const createNonce = (): number => {
    return Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
};

export const getUsernameFromEmail = async (email: string): Promise<string> => {
    const nameFromEmail = email.substring(0, email.indexOf("@"));
    let name = nameFromEmail || email.substring(1) || "SpaceNinja";
    if (await isNameTaken(name)) {
        let suffix = 0;
        do {
            ++suffix;
            name = nameFromEmail + suffix;
        } while (await isNameTaken(name));
    }
    return name;
};

export const createAccount = async (accountData: IAccountCreationData): Promise<IDatabaseAccountJson> => {
    if (isNameReserved(accountData.DisplayName)) {
        throw new Error(`"${accountData.DisplayName}" is reserved and may not be used as a username`);
    }

    const account = new Account(accountData);
    try {
        await account.save();
        const loadout = await createLoadout(account._id);
        const shipId = await createShip(account._id);
        await createPersonalRooms(account._id, shipId);
        await createInventory(account._id, loadout, { loadOutPresetId: loadout._id, ship: shipId });
        await createStats(account._id.toString());
        return account.toJSON();
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("error creating account that is not of instance Error");
    }
};

const createLoadout = async (accountId: Types.ObjectId): Promise<TLoadoutDatabaseDocument> => {
    const loadout = new Loadout({ loadoutOwnerId: accountId });
    const savedLoadout = await loadout.save();
    return savedLoadout;
};

const createPersonalRooms = async (accountId: Types.ObjectId, shipId: Types.ObjectId): Promise<void> => {
    const personalRooms = new PersonalRooms({
        personalRoomsOwnerId: accountId,
        activeShipId: shipId
    });
    await personalRooms.save();
};

export type TAccountDocument = Document<unknown, {}, IDatabaseAccountJson> &
    IDatabaseAccountJson & { _id: Types.ObjectId; __v: number };

export const getAccountForQuery = async (
    query: Record<string, string>,
    acceptToken?: string
): Promise<TAccountDocument> => {
    if (!query.accountId) {
        throw new Error("Request is missing accountId parameter");
    }

    // Tokens are specific to OpenWF to avoid sending the nonce (which gives full account access) over insecure transports.
    if (query.token && acceptToken == query.ct) {
        const account = await Account.findById(query.accountId);
        if (!account || !account.Nonce) {
            throw new Error("Invalid accountId-token pair");
        }
        const token = crypto
            .createHmac("sha256", account.Nonce.toString())
            .update(`accountId=${query.accountId}&ct=${(query.ct as string | undefined) ?? ""}`)
            .digest("hex");
        //console.log(`expected token: ${token}`);
        if (query.token.toLowerCase() != token) {
            throw new Error("Invalid accountId-token pair");
        }
        return account;
    }

    const nonce: number = parseInt(query.nonce);
    if (!nonce) {
        throw new Error("Request is missing nonce parameter");
    }
    const account = await Account.findById(query.accountId);
    if (!account) {
        throw new Error("Invalid accountId-nonce pair");
    }
    if (query.possesser) {
        const possesser = await Account.findOne({ _id: query.possesser, Nonce: nonce });
        if (!possesser || !isAdministrator(possesser)) {
            throw new Error(`Invalid accountId-nonce pair`);
        }
    } else {
        if (account.Nonce != nonce) {
            throw new Error("Invalid accountId-nonce pair");
        }
        if (account.Dropped && query.ct) {
            logger.debug(`removing dropped mark from ${query.accountId}`);
            account.Dropped = undefined;
            await account.save();
        }
    }
    return account;
};

export const getAccountForRequest = (req: Request, acceptToken?: string): Promise<TAccountDocument> => {
    return getAccountForQuery(req.query as Record<string, string>, acceptToken);
};

export const getAccountIdForRequest = async (req: Request): Promise<string> => {
    return (await getAccountForRequest(req))._id.toString();
};

export const getBuildLabelForUnauthenticatedRequest = (req: Request): string => {
    const buildLabel =
        typeof req.query.buildLabel == "string" ? req.query.buildLabel.replaceAll(" ", "+") : config.fallbackBuildLabel;
    if (!buildLabel) {
        throw new Error(`Client provided no buildLabel, and config has no fallbackBuildLabel.`);
    }
    return buildLabel;
};

export const getBuildLabel = (req: Request, account: Pick<TAccountDocument, "BuildLabel">): string => {
    if ("wsid" in req.query) {
        return BL_LATEST; // WebUI
    } else {
        return account.BuildLabel!; // loginController guarantees that a buildLabel is set for game clients.
    }
};

export const isAdministrator = (account: Pick<TAccountDocument, "DisplayName">): boolean => {
    return (config.administratorNames?.indexOf(account.DisplayName) ?? -1) != -1;
};

export const hasPermission = (account: Pick<TAccountDocument, "DisplayName">, perm: string): boolean => {
    if (!isAdministrator(account)) {
        {
            const [obj, idx] = configIdToIndexable(`webui.nonAdminPermissions.${perm}`);
            if (typeof obj[idx] == "boolean") {
                return obj[idx];
            }
        }

        const arr = perm.split(".");
        arr.pop();
        while (arr.length > 1) {
            const [obj, idx] = configIdToIndexable(`webui.nonAdminPermissions.${arr.join(".")}.*`);
            if (typeof obj[idx] == "boolean") {
                return obj[idx];
            }
            arr.pop();
        }

        {
            const [obj, idx] = configIdToIndexable(`webui.nonAdminPermissions.*`);
            if (typeof obj[idx] == "boolean") {
                return obj[idx];
            }
        }
    }
    return true;
};

export const getGoogleAccountData = async (googleTokenId: string | undefined): Promise<IAndroidAccount> => {
    if (!googleTokenId) {
        throw new Error("google token is missing");
    }
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
        idToken: googleTokenId
    });

    const payload = ticket.getPayload();
    if (!payload) {
        throw new Error("payload missing, perhaps invalid google token");
    }

    return { userId: payload["sub"], email: payload["email"] };
};

const getOriginalPlatform = (account: TAccountDocument): number => {
    return account.GoogleTokenId ? ePlatform.Android : ePlatform.Windows;
};

const platform_magics = [753, 639, 247, 37, 60, 161];
export const getSuffixedName = (account: TAccountDocument): string => {
    const name = account.DisplayName;
    const platformId = getOriginalPlatform(account); // Name suffix is based on the original platform, so cross-save does not change it.
    const suffix =
        ((crc32(Buffer.from(name.toLowerCase() + "595", "utf8")) >>> 0) + platform_magics[platformId]) % 1000;
    return name + "#" + suffix.toString().padStart(3, "0");
};

export const getAccountFromSuffixedName = (name: string): Promise<TAccountDocument | null> => {
    return Account.findOne({ DisplayName: name.split("#")[0] });
};

export const getUnicodeName = (account: TAccountDocument, buildLabel: string): string => {
    if (version_compare(buildLabel, gameToBuildVersion["32.0.0"]) < 0) {
        return account.DisplayName;
    }
    const platformId = getOriginalPlatform(account);
    return account.DisplayName + String.fromCharCode(0xe000 + platformId);
};

export const stripUnicodeSuffix = (name: string): string => {
    if (name.charCodeAt(name.length - 1) >= 0xe000) {
        name = name.substring(0, name.length - 1);
    }
    return name;
};

export const buildVersionToInt = (buildVersion: string): number => {
    const [year, month, day, hour, minute] = buildVersion.split(".").map(x => parseInt(x));
    return year * 1_00_00_00_00 + month * 1_00_00_00 + day * 1_00_00 + hour * 1_00 + minute;
};
