/* eslint-disable @typescript-eslint/no-misused-promises */
import { toDatabaseAccount, toCreateAccount } from "@/src/helpers/customHelpers";
import { createAccount } from "@/src/services/loginService";
import { RequestHandler } from "express";

const createAccountController: RequestHandler = async (req, res) => {
    const createAccountData = toCreateAccount(req.body);
    const databaseAccount = toDatabaseAccount(createAccountData);

    const account = await createAccount(databaseAccount);
    res.json(account);
};

export { createAccountController };
