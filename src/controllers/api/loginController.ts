import { RequestHandler } from "express";

import { config } from "@/src/services/configService";
import { buildConfig } from "@/src/services/buildConfigService";

import { Account } from "@/src/models/loginModel";
import { createAccount, isCorrectPassword, isNameTaken } from "@/src/services/loginService";
import { IDatabaseAccountJson, ILoginRequest, ILoginResponse } from "@/src/types/loginTypes";
import { DTLS, groups, HUB, platformCDNs } from "@/static/fixed_responses/login_static";
import { logger } from "@/src/utils/logger";

export const loginController: RequestHandler = async (request, response) => {
    const loginRequest = JSON.parse(String(request.body)) as ILoginRequest; // parse octet stream of json data to json object

    const account = await Account.findOne({ email: loginRequest.email }); //{ _id: 0, __v: 0 }
    const nonce = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);

    const buildLabel: string =
        typeof request.query.buildLabel == "string"
            ? request.query.buildLabel.split(" ").join("+")
            : buildConfig.buildLabel;

    if (!account && config.autoCreateAccount && loginRequest.ClientType != "webui") {
        try {
            const nameFromEmail = loginRequest.email.substring(0, loginRequest.email.indexOf("@"));
            let name = nameFromEmail;
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
                ClientType: loginRequest.ClientType,
                CrossPlatformAllowed: true,
                ForceLogoutVersion: 0,
                ConsentNeeded: false,
                TrackedSettings: [],
                Nonce: nonce
            });
            logger.debug("created new account");
            response.json(createLoginResponse(newAccount, buildLabel));
            return;
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error(`error creating account ${error.message}`);
            }
        }
    }

    //email not found or incorrect password
    if (!account || !isCorrectPassword(loginRequest.password, account.password)) {
        response.status(400).json({ error: "incorrect login data" });
        return;
    }

    if (account.Nonce == 0 || loginRequest.ClientType != "webui") {
        account.Nonce = nonce;
    }
    if (loginRequest.ClientType != "webui") {
        account.CountryCode = loginRequest.lang.toUpperCase();
    }
    await account.save();

    response.json(createLoginResponse(account.toJSON(), buildLabel));
};

const createLoginResponse = (account: IDatabaseAccountJson, buildLabel: string): ILoginResponse => {
    return {
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
        Groups: groups,
        platformCDNs: platformCDNs,
        NRS: [config.myAddress],
        DTLS: DTLS,
        IRC: config.myIrcAddresses ?? [config.myAddress],
        HUB: HUB,
        BuildLabel: buildLabel,
        MatchmakingBuildId: buildConfig.matchmakingBuildId
    };
};
