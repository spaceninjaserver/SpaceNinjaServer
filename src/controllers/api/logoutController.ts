import type { RequestHandler } from "express";
import { Account } from "../../models/loginModel.ts";
import { sendWsBroadcastTo } from "../../services/wsService.ts";

export const logoutController: RequestHandler = async (req, res) => {
    if (!req.query.accountId) {
        throw new Error("Request is missing accountId parameter");
    }
    const nonce: number = parseInt(req.query.nonce as string);
    if (!nonce) {
        throw new Error("Request is missing nonce parameter");
    }

    const stat = await Account.updateOne(
        {
            _id: req.query.accountId,
            Nonce: nonce
        },
        {
            Nonce: 0
        }
    );
    if (stat.modifiedCount) {
        sendWsBroadcastTo(req.query.accountId as string, { nonce_updated: true });
    }

    res.writeHead(200, {
        "Content-Type": "text/html",
        "Content-Length": 1
    });
    res.end("1");
};
