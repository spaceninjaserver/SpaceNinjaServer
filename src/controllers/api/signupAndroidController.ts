import type { RequestHandler } from "express";
import { Account } from "../../models/loginModel.ts";
import { getGoogleAccountData } from "../../helpers/customHelpers/customHelpers.ts";

export const signupAndroidController: RequestHandler = async (request, res) => {
    const googleTokenId = request.query.googleTokenId as string | undefined;
    const { userId } = await getGoogleAccountData(googleTokenId);
    const account = await Account.findOne({ GoogleTokenId: userId });
    if (!account) {
        res.status(400).json({ error: "account not found" });
        return;
    }
    account.DisplayName = request.query.accountName as string;
    await account.save();
    res.status(200).end();
};
