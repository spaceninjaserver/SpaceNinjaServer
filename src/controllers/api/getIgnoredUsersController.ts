import { toOid } from "../../helpers/inventoryHelpers.ts";
import { Account, Ignore } from "../../models/loginModel.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { IFriendInfo } from "../../types/friendTypes.ts";
import { parallelForeach } from "../../utils/async-utils.ts";
import type { RequestHandler } from "express";

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
