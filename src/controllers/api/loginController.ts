import type { Request, RequestHandler } from "express";

import { config, getReflexiveAddress } from "../../services/configService.ts";
import { buildConfig } from "../../services/buildConfigService.ts";

import { Account } from "../../models/loginModel.ts";
import { createAccount, createNonce, getUsernameFromEmail, isCorrectPassword } from "../../services/loginService.ts";
import type { IDatabaseAccountJson, ILoginRequest, ILoginResponse } from "../../types/loginTypes.ts";
import { logger } from "../../utils/logger.ts";
import { version_compare } from "../../helpers/inventoryHelpers.ts";
import { handleNonceInvalidation } from "../../services/wsService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { createMessage } from "../../services/inboxService.ts";
import { fromStoreItem } from "../../services/itemDataService.ts";
import { getTokenForClient, getTunablesForClient } from "../../services/tunablesService.ts";
import type { AddressInfo } from "node:net";
import gameToBuildVersion from "../../../static/fixed_responses/gameToBuildVersion.json" with { type: "json" };

export const loginController: RequestHandler = async (request, response) => {
    const loginRequest = JSON.parse(String(request.body)) as ILoginRequest; // parse octet stream of json data to json object

    if (config.tunables?.useLoginToken) {
        if (request.query.token !== getTokenForClient((request.socket.address() as AddressInfo).address)) {
            response.status(400).json({ error: "missing or incorrect token" });
            return;
        }
    }

    const account = await Account.findOne({ email: loginRequest.email });

    const buildLabel: string =
        typeof request.query.buildLabel == "string"
            ? request.query.buildLabel.split(" ").join("+")
            : buildConfig.buildLabel;

    if (version_compare(buildLabel, "2025.10.29.12.05") > 0) {
        response.status(400).json({ error: "do you want me to change your diapers, too?" });
        return;
    }

    if (
        !account &&
        ((config.autoCreateAccount && loginRequest.ClientType != "webui") ||
            loginRequest.ClientType == "webui-register")
    ) {
        try {
            const name = await getUsernameFromEmail(loginRequest.email);
            const newAccount = await createAccount({
                email: loginRequest.email,
                password: loginRequest.password,
                DisplayName: name,
                CountryCode: loginRequest.lang?.toUpperCase() ?? "EN",
                ClientType: loginRequest.ClientType,
                Nonce: createNonce(),
                BuildLabel: buildLabel,
                LastLogin: new Date()
            });
            logger.debug("created new account");
            response.send(createLoginResponse(request, newAccount, buildLabel)).end();
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

    if (!isCorrectPassword(loginRequest.password, account.password)) {
        response.status(400).json({ error: "incorrect login data" });
        return;
    }

    if (account.Nonce && account.ClientType != "webui" && !account.Dropped && !loginRequest.kick) {
        // U17 seems to handle "nonce still set" like a login failure.
        if (version_compare(buildLabel, gameToBuildVersion["18.0.2"]) >= 0) {
            response.status(400).send({ error: "nonce still set" });
            return;
        }
    }

    account.ClientType = loginRequest.ClientType;
    account.Nonce = createNonce();
    account.CountryCode = loginRequest.lang?.toUpperCase() ?? "EN";
    account.BuildLabel = buildLabel;
    account.LastLogin = new Date();
    await account.save();

    handleNonceInvalidation(account._id.toString());

    // If the client crashed during an endless fissure mission, discharge rewards to an inbox message. (https://www.reddit.com/r/Warframe/comments/5uwwjm/til_if_you_crash_during_a_fissure_you_keep_any/)
    const inventory = await getInventory(account._id.toString(), "MissionRelicRewards");
    if (inventory.MissionRelicRewards) {
        await createMessage(account._id, [
            {
                sndr: "/Lotus/Language/Bosses/Ordis",
                msg: "/Lotus/Language/Menu/VoidProjectionItemsMessage",
                sub: "/Lotus/Language/Menu/VoidProjectionItemsSubject",
                icon: "/Lotus/Interface/Icons/Npcs/Ordis.png",
                countedAtt: inventory.MissionRelicRewards.map(x => ({ ...x, ItemType: fromStoreItem(x.ItemType) })),
                attVisualOnly: true,
                highPriority: true // TOVERIFY
            }
        ]);
        inventory.MissionRelicRewards = undefined;
        await inventory.save();
    }

    response.send(createLoginResponse(request, account.toJSON(), buildLabel)).end();
};

const createLoginResponse = (request: Request, account: IDatabaseAccountJson, buildLabel: string): string => {
    const { myAddress, myUrlBase } = getReflexiveAddress(request);
    const clientMod = request.query.clientMod as string | undefined;

    const resp: ILoginResponse = {
        id: account.id,
        DisplayName: account.DisplayName,
        AmazonAuthToken: account.AmazonAuthToken,
        AmazonRefreshToken: account.AmazonRefreshToken,
        Nonce: account.Nonce,
        BuildLabel: buildLabel
    };
    if (version_compare(buildLabel, gameToBuildVersion["13.0.0"]) >= 0) {
        // U13 and up
        resp.CountryCode = account.CountryCode;
    } else {
        // U12 and down
        resp.NatHash =
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        resp.SteamId = "0";
    }
    if (version_compare(buildLabel, gameToBuildVersion["15.14.1"]) >= 0) {
        resp.NRS = [config.nrsAddress ?? myAddress];
    }
    if (version_compare(buildLabel, gameToBuildVersion["16.5.5"]) >= 0) {
        resp.IRC = [config.ircAddress ?? myAddress];
    }
    if (version_compare(buildLabel, gameToBuildVersion["24.0.0"]) >= 0) {
        resp.ConsentNeeded = account.ConsentNeeded;
        resp.TrackedSettings = account.TrackedSettings;
    }
    if (version_compare(buildLabel, gameToBuildVersion["25.7.0"]) >= 0) {
        resp.ForceLogoutVersion = account.ForceLogoutVersion;
    }
    if (version_compare(buildLabel, gameToBuildVersion["26.0.0"]) >= 0) {
        resp.Groups = [];
    }
    if (version_compare(buildLabel, gameToBuildVersion["30.0.0"]) >= 0) {
        resp.DTLS = config.dtls ?? 0; // bit 0 enables DTLS. if enabled, additional bits can be set, e.g. bit 2 to enable logging. on live, the value is 99.
    }
    if (version_compare(buildLabel, gameToBuildVersion["31.5.0"]) >= 0) {
        resp.ClientType = account.ClientType;
    }
    if (version_compare(buildLabel, gameToBuildVersion["32.0.0"]) >= 0) {
        resp.CrossPlatformAllowed = account.CrossPlatformAllowed;
        resp.HUB = `${myUrlBase}/api/`;

        // The MatchmakingBuildId is a 64-bit integer represented as a decimal string. On live, the value is seemingly random per build, but really any value that is different across builds should work.
        const [year, month, day, hour, minute] = buildLabel.split(".").map(x => parseInt(x));
        resp.MatchmakingBuildId = (
            year * 1_00_00_00_00 +
            month * 1_00_00_00 +
            day * 1_00_00 +
            hour * 1_00 +
            minute
        ).toString();
    }
    if (version_compare(buildLabel, gameToBuildVersion["33.0.0"]) >= 0) {
        if (version_compare(buildLabel, gameToBuildVersion["40.0.0"]) >= 0) {
            // U40 is when they changed this from content.warframe.com/dynamic/ to api.warframe.com/cdn/
            resp.platformCDNs = [`${myUrlBase}/cdn/`];
        } else if (version_compare(buildLabel, gameToBuildVersion["39.1.0"]) >= 0) {
            // U39.1 is when they made dynamic/ explicit
            resp.platformCDNs = [`${myUrlBase}/dynamic/`];
        } else {
            // Pre-39.1 implied dynamic/ for all content requests
            resp.platformCDNs = [`${myUrlBase}/`];
        }
    }

    let raw = JSON.stringify(resp);
    if (
        clientMod &&
        clientMod.startsWith("OpenWF Bootstrapper v") &&
        version_compare(clientMod.substring(21), "0.12.0") >= 0
    ) {
        const tunables = getTunablesForClient((request.socket.address() as AddressInfo).address);
        if (version_compare(buildLabel, gameToBuildVersion["16.5.5"]) < 0) {
            tunables.irc = config.ircAddress ?? myAddress;
        }
        raw += "\t" + JSON.stringify(tunables);
    }
    return raw;
};
