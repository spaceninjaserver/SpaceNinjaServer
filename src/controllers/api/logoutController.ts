import { RequestHandler } from "express";
import { Account } from "@/src/models/loginModel";
import { sendWsBroadcastTo } from "@/src/services/wsService";

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
        // Tell WebUI its nonce has been invalidated
        sendWsBroadcastTo(req.query.accountId as string, { logged_out: true });
    }

    res.writeHead(200, {
        "Content-Type": "text/html",
        "Content-Length": 1
    });
    res.end("1");
};
