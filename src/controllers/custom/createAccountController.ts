import { toCreateAccount, toDatabaseAccount } from "@/src/helpers/customHelpers/customHelpers";
import { createAccount } from "@/src/services/loginService";
import { RequestHandler } from "express";

const createAccountController: RequestHandler = async (req, res) => {
    const createAccountData = toCreateAccount(req.body);
    const databaseAccount = toDatabaseAccount(createAccountData);

    const account = await createAccount(databaseAccount);

    res.json(account);
};

export { createAccountController };
