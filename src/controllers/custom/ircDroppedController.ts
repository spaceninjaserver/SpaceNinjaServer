import { Account } from "@/src/models/loginModel";
import { RequestHandler } from "express";

export const ircDroppedController: RequestHandler = async (req, res) => {
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
            Dropped: true
        }
    );

    res.end();
};
