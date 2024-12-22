/* eslint-disable @typescript-eslint/no-unused-vars */
import { RequestHandler } from "express";

import { config } from "@/src/services/configService";
import buildConfig from "@/static/data/buildConfig.json";

import { toLoginRequest } from "@/src/helpers/loginHelpers";
import { Account } from "@/src/models/loginModel";
import { createAccount, isCorrectPassword } from "@/src/services/loginService";
import { IDatabaseAccountDocument, ILoginResponse } from "@/src/types/loginTypes";
import { DTLS, groups, HUB, platformCDNs } from "@/static/fixed_responses/login_static";
import { logger } from "@/src/utils/logger";

export const loginController: RequestHandler = async (request, response) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
    const body = JSON.parse(request.body); // parse octet stream of json data to json object
    const loginRequest = toLoginRequest(body);

    const account = await Account.findOne({ email: loginRequest.email }); //{ _id: 0, __v: 0 }
    const nonce = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);

    const buildLabel: string =
        typeof request.query.buildLabel == "string"
            ? request.query.buildLabel.split(" ").join("+")
            : buildConfig.buildLabel;

    if (!account && config.autoCreateAccount && loginRequest.ClientType != "webui") {
        try {
            const newAccount = await createAccount({
                email: loginRequest.email,
                password: loginRequest.password,
                DisplayName: loginRequest.email.substring(0, loginRequest.email.indexOf("@")),
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

const createLoginResponse = (acct: IDatabaseAccountDocument, buildLabel: string): ILoginResponse => {
    return {
        id: acct.id,
        DisplayName: acct.DisplayName,
        CountryCode: acct.CountryCode,
        ClientType: acct.ClientType,
        CrossPlatformAllowed: acct.CrossPlatformAllowed,
        ForceLogoutVersion: acct.ForceLogoutVersion,
        AmazonAuthToken: acct.AmazonAuthToken,
        AmazonRefreshToken: acct.AmazonRefreshToken,
        ConsentNeeded: acct.ConsentNeeded,
        TrackedSettings: acct.TrackedSettings,
        Nonce: acct.Nonce,
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
