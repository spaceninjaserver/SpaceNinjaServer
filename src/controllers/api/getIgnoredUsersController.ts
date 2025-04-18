import { toOid } from "@/src/helpers/inventoryHelpers";
import { Account, Ignore } from "@/src/models/loginModel";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IFriendInfo } from "@/src/types/guildTypes";
import { parallelForeach } from "@/src/utils/async-utils";
import { RequestHandler } from "express";

export const getIgnoredUsersController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const ignores = await Ignore.find({ ignorer: accountId });
    const ignoredUsers: IFriendInfo[] = [];
    await parallelForeach(ignores, async ignore => {
        const ignoreeAccount = (await Account.findById(ignore.ignoree, "DisplayName"))!;
        ignoredUsers.push({
            _id: toOid(ignore.ignoree),
            DisplayName: ignoreeAccount.DisplayName + ""
        });
    });
    res.json({ IgnoredUsers: ignoredUsers });
};
