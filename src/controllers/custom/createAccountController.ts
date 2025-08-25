import { toCreateAccount, toDatabaseAccount } from "../../helpers/customHelpers/customHelpers.ts";
import { createAccount, isNameTaken } from "../../services/loginService.ts";
import type { RequestHandler } from "express";

const createAccountController: RequestHandler = async (req, res) => {
    const createAccountData = toCreateAccount(req.body);
    if (await isNameTaken(createAccountData.DisplayName)) {
        res.status(409).json("Name already in use");
    } else {
        const databaseAccount = toDatabaseAccount(createAccountData);
        const account = await createAccount(databaseAccount);
        res.json(account);
    }
};

export { createAccountController };
