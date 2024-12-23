import { toCreateAccount, toDatabaseAccount } from "@/src/helpers/customHelpers/customHelpers";
import { createAccount, isNameTaken } from "@/src/services/loginService";
import { RequestHandler } from "express";

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
