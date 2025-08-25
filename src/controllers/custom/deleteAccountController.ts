import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { Account, Ignore } from "../../models/loginModel.ts";
import { Inbox } from "../../models/inboxModel.ts";
import { Inventory } from "../../models/inventoryModels/inventoryModel.ts";
import { Loadout } from "../../models/inventoryModels/loadoutModel.ts";
import { PersonalRooms } from "../../models/personalRoomsModel.ts";
import { Ship } from "../../models/shipModel.ts";
import { Stats } from "../../models/statsModel.ts";
import { GuildMember } from "../../models/guildModel.ts";
import { Leaderboard } from "../../models/leaderboardModel.ts";
import { deleteGuild } from "../../services/guildService.ts";
import { Friendship } from "../../models/friendModel.ts";
import { sendWsBroadcastTo } from "../../services/wsService.ts";

export const deleteAccountController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);

    // If account is the founding warlord of a guild, delete that guild as well.
    const guildMember = await GuildMember.findOne({ accountId, rank: 0, status: 0 });
    if (guildMember) {
        await deleteGuild(guildMember.guildId);
    }

    await Promise.all([
        Account.deleteOne({ _id: accountId }),
        Friendship.deleteMany({ owner: accountId }),
        Friendship.deleteMany({ friend: accountId }),
        GuildMember.deleteMany({ accountId: accountId }),
        Ignore.deleteMany({ ignorer: accountId }),
        Ignore.deleteMany({ ignoree: accountId }),
        Inbox.deleteMany({ ownerId: accountId }),
        Inventory.deleteOne({ accountOwnerId: accountId }),
        Leaderboard.deleteMany({ ownerId: accountId }),
        Loadout.deleteOne({ loadoutOwnerId: accountId }),
        PersonalRooms.deleteOne({ personalRoomsOwnerId: accountId }),
        Ship.deleteMany({ ShipOwnerId: accountId }),
        Stats.deleteOne({ accountOwnerId: accountId })
    ]);

    sendWsBroadcastTo(accountId, { logged_out: true });

    res.end();
};
