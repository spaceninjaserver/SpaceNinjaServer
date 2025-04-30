import { RequestHandler } from "express";

import { config } from "@/src/services/configService";
import { buildConfig } from "@/src/services/buildConfigService";

import { Account } from "@/src/models/loginModel";
import { createAccount, isCorrectPassword, isNameTaken } from "@/src/services/loginService";
import { IDatabaseAccountJson, ILoginRequest, ILoginResponse } from "@/src/types/loginTypes";
import { logger } from "@/src/utils/logger";
import { version_compare } from "@/src/services/worldStateService";

export const loginController: RequestHandler = async (request, response) => {
    const loginRequest = JSON.parse(String(request.body)) as ILoginRequest; // parse octet stream of json data to json object

    const account = await Account.findOne({ email: loginRequest.email });
    const nonce = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);

    const buildLabel: string =
        typeof request.query.buildLabel == "string"
            ? request.query.buildLabel.split(" ").join("+")
            : buildConfig.buildLabel;

    const myAddress = request.host.indexOf("warframe.com") == -1 ? request.host : config.myAddress;

    if (
        !account &&
        ((config.autoCreateAccount && loginRequest.ClientType != "webui") ||
            loginRequest.ClientType == "webui-register")
    ) {
        try {
            const nameFromEmail = loginRequest.email.substring(0, loginRequest.email.indexOf("@"));
            let name = nameFromEmail || loginRequest.email.substring(1) || "SpaceNinja";
            if (await isNameTaken(name)) {
                let suffix = 0;
                do {
                    ++suffix;
                    name = nameFromEmail + suffix;
                } while (await isNameTaken(name));
            }
            const newAccount = await createAccount({
                email: loginRequest.email,
                password: loginRequest.password,
                DisplayName: name,
                CountryCode: loginRequest.lang.toUpperCase(),
                ClientType: loginRequest.ClientType == "webui-register" ? "webui" : loginRequest.ClientType,
                CrossPlatformAllowed: true,
                ForceLogoutVersion: 0,
                ConsentNeeded: false,
                TrackedSettings: [],
                Nonce: nonce
            });
            logger.debug("created new account");
            response.json(createLoginResponse(myAddress, newAccount, buildLabel));
            return;
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error(`error creating account ${error.message}`);
            }
        }
    }

    if (!account) {
        response.status(400).json({ error: "unknown user" });
        return;
    }

    if (loginRequest.ClientType == "webui-register") {
        response.status(400).json({ error: "account already exists" });
        return;
    }

    if (!isCorrectPassword(loginRequest.password, account.password)) {
        response.status(400).json({ error: "incorrect login data" });
        return;
    }

    if (loginRequest.ClientType == "webui") {
        if (!account.Nonce) {
            account.ClientType = "webui";
            account.Nonce = nonce;
        }
    } else {
        if (account.Nonce && account.ClientType != "webui" && !account.Dropped && !loginRequest.kick) {
            response.status(400).json({ error: "nonce still set" });
            return;
        }

        account.ClientType = loginRequest.ClientType;
        account.Nonce = nonce;
        account.CountryCode = loginRequest.lang.toUpperCase();
    }
    await account.save();

    response.json(createLoginResponse(myAddress, account.toJSON(), buildLabel));
};

const createLoginResponse = (myAddress: string, account: IDatabaseAccountJson, buildLabel: string): ILoginResponse => {
    const resp: ILoginResponse = {
        id: account.id,
        DisplayName: account.DisplayName,
        CountryCode: account.CountryCode,
        ClientType: account.ClientType,
        CrossPlatformAllowed: account.CrossPlatformAllowed,
        ForceLogoutVersion: account.ForceLogoutVersion,
        AmazonAuthToken: account.AmazonAuthToken,
        AmazonRefreshToken: account.AmazonRefreshToken,
        ConsentNeeded: account.ConsentNeeded,
        TrackedSettings: account.TrackedSettings,
        Nonce: account.Nonce,
        Groups: [],
        IRC: config.myIrcAddresses ?? [myAddress],
        HUB: `https://${myAddress}/api/`,
        NRS: config.NRS,
        DTLS: 99,
        BuildLabel: buildLabel,
        MatchmakingBuildId: buildConfig.matchmakingBuildId
    };
    if (version_compare(buildLabel, "2023.04.25.23.40") >= 0) {
        resp.platformCDNs = [`https://${myAddress}/`];
    }
    return resp;
};
