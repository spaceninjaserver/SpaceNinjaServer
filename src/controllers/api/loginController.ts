import config from "@/config.json";
import { removeKeysFromObject } from "@/src/helpers/general";
import { toLoginRequest } from "@/src/helpers/loginHelpers";
import { Account } from "@/src/models/loginModel";
import { createAccount, isCorrectPassword } from "@/src/services/loginService";
import { ILoginResponse } from "@/src/types/loginTypes";
import { DTLS, HUB, IRC, NRS, Nonce, groups, platformCDNs } from "@/static/fixed_responses/login_static";
import { RequestHandler } from "express";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const loginController: RequestHandler = async (request, response) => {
    const body: unknown = JSON.parse(String(request.body));
    const loginRequest = toLoginRequest(body);

    const account = await Account.findOne({ email: loginRequest.email }); //{ _id: 0, __v: 0 }

    if (!account && config.autoCreateAccount) {
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
                TrackedSettings: []
            });

            const databaseAccount = removeKeysFromObject(newAccount, ["email", "password"]);
            const newLoginResponse: ILoginResponse = {
                ...databaseAccount,
                Groups: groups,
                platformCDNs: platformCDNs,
                Nonce: Nonce,
                NRS: NRS,
                DTLS: DTLS,
                IRC: IRC,
                HUB: HUB,
                BuildLabel: config.buildLabel,
                MatchmakingBuildId: config.matchmakingBuildId
            };

            response.json(newLoginResponse);
            return;
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error("error creating account");
            }
        }
    }

    //email not found or incorrect password
    if (!account || !isCorrectPassword(loginRequest.password, account.password)) {
        response.status(400).json({ error: "incorrect login data" });
        return;
    }

    const databaseAccount = removeKeysFromObject(account.toJSON(), ["email", "password"]);
    const newLoginResponse: ILoginResponse = {
        ...databaseAccount,
        Groups: groups,
        platformCDNs: platformCDNs,
        Nonce: Nonce,
        NRS: NRS,
        DTLS: DTLS,
        IRC: IRC,
        HUB: HUB,
        BuildLabel: config.buildLabel,
        MatchmakingBuildId: config.matchmakingBuildId
    };

    response.json(newLoginResponse);
};

export { loginController };
