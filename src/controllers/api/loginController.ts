/* eslint-disable @typescript-eslint/no-unused-vars */
import { RequestHandler } from "express";

import { config } from "@/src/services/configService";
import buildConfig from "@/static/data/buildConfig.json";

import { toLoginRequest } from "@/src/helpers/loginHelpers";
import { Account } from "@/src/models/loginModel";
import { createAccount, isCorrectPassword } from "@/src/services/loginService";
import { ILoginResponse } from "@/src/types/loginTypes";
import { logger } from "@/src/utils/logger";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const loginController: RequestHandler = async (request, response) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
    const body = JSON.parse(request.body); // parse octet stream of json data to json object
    const loginRequest = toLoginRequest(body);

    const account = await Account.findOne({ email: loginRequest.email });
    const nonce = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);

    if (!account && config.autoCreateAccount && loginRequest.ClientType != "webui") {
        try {
            const newAccount = await createAccount({
                email: loginRequest.email,
                password: loginRequest.password,
                DisplayName: loginRequest.email.substring(0, loginRequest.email.indexOf("@")),
                Nonce: nonce
            });
            logger.debug("created new account");
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { email, password, ...databaseAccount } = newAccount;
            const newLoginResponse: ILoginResponse = {
                ...databaseAccount,
                BuildLabel: buildConfig.buildLabel,
                NatHash: "0",
                SteamId: "0"
            };

            response.json(newLoginResponse);
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

    await account.save();

    const { email, password, ...databaseAccount } = account.toJSON();
    const newLoginResponse: ILoginResponse = {
        ...databaseAccount,
        BuildLabel: buildConfig.buildLabel,
        NatHash: "0",
        SteamId: "0"
    };

    response.json(newLoginResponse);
};

export { loginController };
