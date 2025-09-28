import type { RequestHandler } from "express";
import { getAccountForRequest } from "../../services/loginService.ts";
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
import { config } from "../../services/configService.ts";
import { saveConfig } from "../../services/configWriterService.ts";

export const deleteAccountController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);

    // If this account is an admin, remove it from administratorNames
    if (config.administratorNames) {
        const adminIndex = config.administratorNames.indexOf(account.DisplayName);
        if (adminIndex != -1) {
            config.administratorNames.splice(adminIndex, 1);
            await saveConfig();
        }
    }

    // If account is the founding warlord of a guild, delete that guild as well.
    const guildMember = await GuildMember.findOne({ accountId: account._id, rank: 0, status: 0 });
    if (guildMember) {
        await deleteGuild(guildMember.guildId);
    }

    await Promise.all([
        Account.deleteOne({ _id: account._id }),
        Friendship.deleteMany({ owner: account._id }),
        Friendship.deleteMany({ friend: account._id }),
        GuildMember.deleteMany({ accountId: account._id }),
        Ignore.deleteMany({ ignorer: account._id }),
        Ignore.deleteMany({ ignoree: account._id }),
        Inbox.deleteMany({ ownerId: account._id }),
        Inventory.deleteOne({ accountOwnerId: account._id }),
        Leaderboard.deleteMany({ ownerId: account._id }),
        Loadout.deleteOne({ loadoutOwnerId: account._id }),
        PersonalRooms.deleteOne({ personalRoomsOwnerId: account._id }),
        Ship.deleteMany({ ShipOwnerId: account._id }),
        Stats.deleteOne({ accountOwnerId: account._id })
    ]);

    sendWsBroadcastTo(account._id.toString(), { logged_out: true });

    res.end();
};
