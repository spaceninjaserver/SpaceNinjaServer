import { RequestHandler } from "express";

import { config } from "@/src/services/configService";
import { buildConfig } from "@/src/services/buildConfigService";

import { Account } from "@/src/models/loginModel";
import { createAccount, isCorrectPassword, isNameTaken } from "@/src/services/loginService";
import { IDatabaseAccountJson, ILoginRequest, ILoginResponse } from "@/src/types/loginTypes";
import { logger } from "@/src/utils/logger";
import { version_compare } from "@/src/helpers/inventoryHelpers";

export const loginController: RequestHandler = async (request, response) => {
    const loginRequest = JSON.parse(String(request.body)) as ILoginRequest; // parse octet stream of json data to json object

    const account = await Account.findOne({ email: loginRequest.email });
    const nonce = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);

    const buildLabel: string =
        typeof request.query.buildLabel == "string"
            ? request.query.buildLabel.split(" ").join("+")
            : buildConfig.buildLabel;

    let myAddress: string;
    let myUrlBase: string = request.protocol + "://";
    if (request.host.indexOf("warframe.com") == -1) {
        // Client request was redirected cleanly, so we know it can reach us how it's reaching us now.
        myAddress = request.hostname;
        myUrlBase += request.host;
    } else {
        // Don't know how the client reached us, hoping the config does.
        myAddress = config.myAddress;
        myUrlBase += myAddress;
        const port: number = request.protocol == "http" ? config.httpPort || 80 : config.httpsPort || 443;
        if (port != (request.protocol == "http" ? 80 : 443)) {
            myUrlBase += ":" + port;
        }
    }

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
                CountryCode: loginRequest.lang?.toUpperCase() ?? "EN",
                ClientType: loginRequest.ClientType == "webui-register" ? "webui" : loginRequest.ClientType,
                CrossPlatformAllowed: true,
                ForceLogoutVersion: 0,
                ConsentNeeded: false,
                TrackedSettings: [],
                Nonce: nonce,
                BuildLabel: buildLabel,
                LastLogin: new Date()
            });
            logger.debug("created new account");
            response.json(createLoginResponse(myAddress, myUrlBase, newAccount, buildLabel));
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
            // U17 seems to handle "nonce still set" like a login failure.
            if (version_compare(buildLabel, "2015.12.05.18.07") >= 0) {
                response.status(400).send({ error: "nonce still set" });
                return;
            }
        }

        account.ClientType = loginRequest.ClientType;
        account.Nonce = nonce;
        account.CountryCode = loginRequest.lang?.toUpperCase() ?? "EN";
        account.BuildLabel = buildLabel;
        account.LastLogin = new Date();
    }
    await account.save();

    response.json(createLoginResponse(myAddress, myUrlBase, account.toJSON(), buildLabel));
};

const createLoginResponse = (
    myAddress: string,
    myUrlBase: string,
    account: IDatabaseAccountJson,
    buildLabel: string
): ILoginResponse => {
    const resp: ILoginResponse = {
        id: account.id,
        DisplayName: account.DisplayName,
        CountryCode: account.CountryCode,
        AmazonAuthToken: account.AmazonAuthToken,
        AmazonRefreshToken: account.AmazonRefreshToken,
        Nonce: account.Nonce,
        BuildLabel: buildLabel
    };
    if (version_compare(buildLabel, "2015.02.13.10.41") >= 0) {
        resp.NRS = config.NRS;
    }
    if (version_compare(buildLabel, "2015.05.14.16.29") >= 0) {
        // U17 and up
        resp.IRC = config.myIrcAddresses ?? [myAddress];
    }
    if (version_compare(buildLabel, "2018.11.08.14.45") >= 0) {
        // U24 and up
        resp.ConsentNeeded = account.ConsentNeeded;
        resp.TrackedSettings = account.TrackedSettings;
    }
    if (version_compare(buildLabel, "2019.08.29.20.01") >= 0) {
        // U25.7 and up
        resp.ForceLogoutVersion = account.ForceLogoutVersion;
    }
    if (version_compare(buildLabel, "2019.10.31.22.42") >= 0) {
        // U26 and up
        resp.Groups = [];
    }
    if (version_compare(buildLabel, "2021.04.13.19.58") >= 0) {
        resp.DTLS = 99;
    }
    if (version_compare(buildLabel, "2022.04.29.12.53") >= 0) {
        resp.ClientType = account.ClientType;
    }
    if (version_compare(buildLabel, "2022.09.06.19.24") >= 0) {
        resp.CrossPlatformAllowed = account.CrossPlatformAllowed;
        resp.HUB = `${myUrlBase}/api/`;
        resp.MatchmakingBuildId = buildConfig.matchmakingBuildId;
    }
    if (version_compare(buildLabel, "2023.04.25.23.40") >= 0) {
        resp.platformCDNs = [`${myUrlBase}/`];
    }
    return resp;
};
