import { RequestHandler } from "express";
import { Account } from "@/src/models/loginModel";

export const logoutController: RequestHandler = async (req, res) => {
    if (!req.query.accountId) {
        throw new Error("Request is missing accountId parameter");
    }
    const nonce: number = parseInt(req.query.nonce as string);
    if (!nonce) {
        throw new Error("Request is missing nonce parameter");
    }

    await Account.updateOne(
        {
            _id: req.query.accountId,
            Nonce: nonce
        },
        {
            Nonce: 0
        }
    );

    res.writeHead(200, {
        "Content-Type": "text/html",
        "Content-Length": 1
    });
    res.end("1");
};
