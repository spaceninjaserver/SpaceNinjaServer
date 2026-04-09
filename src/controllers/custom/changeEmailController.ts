import type { RequestHandler } from "express";
import { Account } from "../../models/loginModel.ts";
import { getAccountForRequest, isCorrectPassword } from "../../services/loginService.ts";

interface IChangeEmailBody {
    currentPassword?: string;
    newEmail?: string;
}

export const changeEmailController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const body = req.body as IChangeEmailBody;
    if (typeof body.currentPassword != "string" || typeof body.newEmail != "string") {
        res.status(400).send("Missing fields").end();
        return;
    }
    const newEmail = body.newEmail.trim().toLowerCase();
    if (!newEmail.includes("@")) {
        res.status(400).send("Invalid email").end();
        return;
    }
    if (!isCorrectPassword(body.currentPassword, account.password)) {
        res.status(403).send("Wrong password").end();
        return;
    }
    if (newEmail === account.email) {
        res.send("noop").end();
        return;
    }
    const taken = await Account.findOne({ email: newEmail });
    if (taken) {
        res.status(409).send("Email already in use").end();
        return;
    }
    account.email = newEmail;
    await account.save();
    res.end();
};
