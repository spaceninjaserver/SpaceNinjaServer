import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { Account } from "@/src/models/loginModel";
import { Inbox } from "@/src/models/inboxModel";
import { Inventory } from "@/src/models/inventoryModels/inventoryModel";
import { Loadout } from "@/src/models/inventoryModels/loadoutModel";
import { PersonalRooms } from "@/src/models/personalRoomsModel";
import { Ship } from "@/src/models/shipModel";
import { Stats } from "@/src/models/statsModel";
import { GuildMember } from "@/src/models/guildModel";
import { Leaderboard } from "@/src/models/leaderboardModel";
import { deleteGuild } from "@/src/services/guildService";

export const deleteAccountController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);

    // If account is the founding warlord of a guild, delete that guild as well.
    const guildMember = await GuildMember.findOne({ accountId, rank: 0, status: 0 });
    if (guildMember) {
        await deleteGuild(guildMember.guildId);
    }

    await Promise.all([
        Account.deleteOne({ _id: accountId }),
        GuildMember.deleteMany({ accountId: accountId }),
        Inbox.deleteMany({ ownerId: accountId }),
        Inventory.deleteOne({ accountOwnerId: accountId }),
        Leaderboard.deleteMany({ ownerId: accountId }),
        Loadout.deleteOne({ loadoutOwnerId: accountId }),
        PersonalRooms.deleteOne({ personalRoomsOwnerId: accountId }),
        Ship.deleteMany({ ShipOwnerId: accountId }),
        Stats.deleteOne({ accountOwnerId: accountId })
    ]);
    res.end();
};
