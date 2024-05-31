import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { Account } from "@/src/models/loginModel";

const logoutController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const account = await Account.findOne({ _id: accountId });
    if (account) {
        account.Nonce = 0;
        await account.save();
    }
    res.writeHead(200, {
        "Content-Type": "text/html",
        "Content-Length": 1
    });
    res.end("1");
};

export { logoutController };
