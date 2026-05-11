import type { Request, RequestHandler } from "express";

import { config, getReflexiveAddress } from "../../services/configService.ts";

import { Account } from "../../models/loginModel.ts";
import {
    buildVersionToInt,
    createAccount,
    createNonce,
    getBuildLabelForUnauthenticatedRequest,
    getGoogleAccountData,
    getUsernameFromEmail,
    isCorrectPassword
} from "../../services/loginService.ts";
import {
    ePlatform,
    type IDatabaseAccountJson,
    type ILoginRequest,
    type ILoginResponse
} from "../../types/loginTypes.ts";
import { logger } from "../../utils/logger.ts";
import { version_compare } from "../../helpers/inventoryHelpers.ts";
import { handleNonceInvalidation } from "../../services/wsService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { createMessage } from "../../services/inboxService.ts";
import { fromStoreItem } from "../../services/itemDataService.ts";
import { getTokenForClient, getTunablesForClient } from "../../services/tunablesService.ts";
import type { AddressInfo } from "node:net";
import gameToBuildVersion from "../../constants/gameToBuildVersion.ts";
import { args } from "../../helpers/commandLineArguments.ts";

export const loginController: RequestHandler = async (request, response) => {
    const loginRequest = JSON.parse(String(request.body)) as ILoginRequest; // parse octet stream of json data to json object

    const isAndroid = loginRequest.ClientType === "Android";
    if (isAndroid) {
        try {
            const { userId, email } = await getGoogleAccountData(loginRequest.GoogleTokenId);
            loginRequest.email = email ?? "";
            loginRequest.GoogleTokenId = userId;
        } catch (error: unknown) {
            response.status(400).json({ error: "incorrect login data" });
            return;
        }
        loginRequest.password = "android"; // edit in mongodb if you want to access it via webui
    }

    if (!loginRequest.email) {
        response.status(400).json({ error: "incorrect login data" });
        return;
    }

    if (config.tunables?.useLoginToken) {
        if (request.query.token !== getTokenForClient((request.socket.address() as AddressInfo).address)) {
            response.status(400).json({ error: "missing or incorrect token" });
            return;
        }
    }

    const account = await Account.findOne({ email: loginRequest.email });

    const buildLabel = getBuildLabelForUnauthenticatedRequest(request);

    if (version_compare(buildLabel, gameToBuildVersion["42.0.0"]) >= 0) {
        if (args.dev) {
            logger.debug(`We are eagerly awaiting your pull requests!`);
        } else {
            response.status(400).json({ error: "I'm making a list and checking it twice" });
            return;
        }
    }

    if (!account && config.autoCreateAccount) {
        // Early versions (~U14) allow login with the password field being empty.
        if (
            loginRequest.password ==
            "19fa61d75522a4669b44e39c1d2e1726c530232130d407f89afee0964997f7a73e83be698b288febcf88e3e03c4f0757ea8964e59b63d93708b138cc42a66eb3"
        ) {
            response.status(400).json({ error: "please enter a password ._." });
            return;
        }

        const name = await getUsernameFromEmail(loginRequest.email);
        const newAccount = await createAccount({
            email: loginRequest.email,
            password: loginRequest.password,
            DisplayName: name,
            Language: loginRequest.lang,
            ClientType: loginRequest.ClientType,
            GoogleTokenId: loginRequest.GoogleTokenId,
            Nonce: createNonce(),
            BuildLabel: buildLabel,
            LastLogin: new Date()
        });
        logger.debug("created new account");
        if (isAndroid) {
            response.status(400).json({ error: `noAndroidAccount;countryCode=US` });
        } else {
            response.send(createLoginResponse(request, newAccount, buildLabel)).end();
        }
        return;
    }

    if (!account) {
        response.status(400).json({ error: "unknown user" });
        return;
    }

    if (isAndroid) {
        if (loginRequest.GoogleTokenId !== account.GoogleTokenId) {
            response.status(400).json({ error: "incorrect login data" });
            return;
        }
    } else {
        if (!isCorrectPassword(loginRequest.password, account.password)) {
            response.status(400).json({ error: "incorrect login data" });
            return;
        }
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
    if (loginRequest.lang) {
        account.Language = loginRequest.lang;
    }
    account.BuildLabel = buildLabel;
    account.LastLogin = new Date();
    account.LastPlatform = isAndroid ? ePlatform.Android : ePlatform.Windows;
    account.Dropped = undefined;

    // These fields used to be set by default but are really not needed
    account.CountryCode = undefined;
    account.ConsentNeeded = undefined;
    account.TrackedSettings = undefined;
    account.ForceLogoutVersion = undefined;
    account.CrossPlatformAllowed = undefined;

    await account.save();

    handleNonceInvalidation(account._id.toString());

    // If the client crashed during an endless fissure mission, discharge rewards to an inbox message. (https://www.reddit.com/r/Warframe/comments/5uwwjm/til_if_you_crash_during_a_fissure_you_keep_any/)
    const inventory = await getInventory(account._id, "MissionRelicRewards");
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
        Nonce: account.Nonce
    };
    if (version_compare(buildLabel, gameToBuildVersion["7.3.0"]) >= 0) {
        resp.BuildLabel = buildLabel; // U5 no likey
    }
    if (version_compare(buildLabel, gameToBuildVersion["12.5.2"]) >= 0) {
        // U12.5 and up

        // CountryCode should be based on the IP address so the client can pick a good matchmaking region automatically.
        // An IP-country database might be a bit overkill, so we just let the client pick based on system language, instead.
        resp.CountryCode = "";
    } else {
        // U12.4 and down

        // The NatHash is a 64 byte (128 hexit) value which was presumably used for NRS authentication.
        // (OpenWF-specific) We can use this to smuggle custom data like the username to NRS.
        resp.NatHash = Array.from(new TextEncoder().encode("OWF1" + account.DisplayName))
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join("")
            .padEnd(128, "0");

        if (version_compare(buildLabel, gameToBuildVersion["7.3.0"]) >= 0) {
            resp.SteamId = "0"; // U5 no likey
        }
    }
    if (version_compare(buildLabel, gameToBuildVersion["15.14.1"]) >= 0) {
        resp.NRS = (config.nrsAddresses ?? []).map(x => x.replaceAll("%THIS_MACHINE%", myAddress));
        // U16 ~ U28 are known to show an "Internal error." popup with an empty array.
        if (resp.NRS.length == 0 && version_compare(buildLabel, gameToBuildVersion["29.0.0"]) < 0) {
            resp.NRS.push(myAddress);
        }
    }
    if (version_compare(buildLabel, gameToBuildVersion["16.5.5"]) >= 0) {
        resp.IRC = [(config.ircAddress || "%THIS_MACHINE%").replaceAll("%THIS_MACHINE%", myAddress)];
    }
    if (version_compare(buildLabel, gameToBuildVersion["24.0.0"]) >= 0) {
        resp.ConsentNeeded = false;
        resp.TrackedSettings = [];
    }
    if (version_compare(buildLabel, gameToBuildVersion["25.7.0"]) >= 0) {
        resp.ForceLogoutVersion = 0;
    }
    if (version_compare(buildLabel, gameToBuildVersion["26.0.0"]) >= 0) {
        // Example values from live:
        // - [{"experiment":"landingPageAB2368","experimentGroup":"control"},{"experiment":"InGameMarketRelatedItemsData","experimentGroup":"related_items_priority_control"},{"experiment":"GamesightAB","experimentGroup":"b"}]
        // - [{"experiment":"LandingPageAB2368","experimentGroup":"control"},{"experiment":"GamesightAB","experimentGroup":"b"},{"experiment":"InGameMarketRelatedItemsData","experimentGroup":"related_items_priority_control"},{"experiment":"InGameMarketRelatedItemsDisplay","experimentGroup":"related_items_preview_control"},{"experiment":"ConsoleBonusPlatLowGDP","experimentGroup":"LowGDP_FewerLargerBonuses"}]
        // - [{"experiment":"LandingPageAB2368","experimentGroup":"control"},{"experiment":"LandingPageAB9364","experimentGroup":"control"},{"experiment":"GamesightAB","experimentGroup":"b"},{"experiment":"InGameMarketRelatedItemsData","experimentGroup":"related_items_priority_control"},{"experiment":"InGameMarketRelatedItemsDisplay","experimentGroup":"related_items_preview_control"},{"experiment":"MarketDualPack","experimentGroup":"dual_packs_enabled"},{"experiment":"ConsoleBonusPlatLowGDP","experimentGroup":"LowGDP_FewerLargerBonuses"},{"experiment":"ConsoleBonusPlatV2LowGDP","experimentGroup":"LowGDP_LargerBonuses"}]
        // - [{"experiment":"ConsoleBonusPlatV2LowGDP","experimentGroup":"LowGDP_LargerBonuses"}]
        resp.Groups = [
            //{ experiment: "matchmaking_vp_4", experimentGroup: "matchmaking_vp_4" }, // Matchmaking for VorsPrize MissionFour
            //{ experiment: "matchmaking_vp_all", experimentGroup: "matchmaking_vp_all" }, // Matchmaking for VorsPrize MissionSix
            //{ experiment: "arsenal_auto_open", experimentGroup: "arsenal_auto_open" }, // Automatically opens the arsenal after installing the ship feature
            //{ experiment: "igm_new_player_recommended_title", experimentGroup: "igm_new_player_recommended_title" }, // Shows "new players" market section for MR 0-3 players
            //{ experiment: "quick_buy_visible", experimentGroup: "quick_buy_visible" } // Shows "quick buy" market section for MR 4+ players
        ];
    }
    if (version_compare(buildLabel, gameToBuildVersion["30.0.0"]) >= 0) {
        resp.DTLS = config.dtls ?? 0; // bit 0 enables DTLS. if enabled, additional bits can be set, e.g. bit 2 to enable logging. on live, the value is 99.
    }
    if (version_compare(buildLabel, gameToBuildVersion["31.5.0"]) >= 0) {
        resp.ClientType = account.ClientType;
    }
    if (version_compare(buildLabel, gameToBuildVersion["32.0.0"]) >= 0) {
        resp.CrossPlatformAllowed = true;
        resp.HUB = `${myUrlBase}/api/`;

        // The MatchmakingBuildId is a 64-bit integer represented as a decimal string. On live, the value is seemingly random per build, but really any value that is different across builds should work.
        resp.MatchmakingBuildId = buildVersionToInt(buildLabel).toString();
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
    if (version_compare(buildLabel, gameToBuildVersion["42.0.0"]) >= 0) {
        resp.Token =
            Math.trunc(Date.now() / 1000)
                .toString(16)
                .padStart(16, "0") + "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        resp.TokenTTL = 999999999999999;
    }

    let raw = JSON.stringify(resp);
    if (
        clientMod &&
        decodeURIComponent(clientMod).startsWith("OpenWF Bootstrapper v") &&
        version_compare(decodeURIComponent(clientMod).substring(21), "0.12.0") >= 0
    ) {
        raw +=
            "\t" + JSON.stringify(getTunablesForClient((request.socket.address() as AddressInfo).address, myAddress));
    }
    return raw;
};
