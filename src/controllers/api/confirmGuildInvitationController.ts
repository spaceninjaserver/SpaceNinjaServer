import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { Guild, GuildMember } from "@/src/models/guildModel";
import { Account } from "@/src/models/loginModel";
import {
    deleteGuild,
    getGuildClient,
    giveClanKey,
    hasGuildPermission,
    removeDojoKeyItems
} from "@/src/services/guildService";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountForRequest, getAccountIdForRequest, getSuffixedName } from "@/src/services/loginService";
import { GuildPermission } from "@/src/types/guildTypes";
import { IInventoryChanges } from "@/src/types/purchaseTypes";
import { RequestHandler } from "express";
import { Types } from "mongoose";

// GET request: A player accepting an invite they got in their inbox.
export const confirmGuildInvitationGetController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const invitedGuildMember = await GuildMember.findOne({
        accountId: account._id,
        guildId: req.query.clanId as string
    });
    if (invitedGuildMember && invitedGuildMember.status == 2) {
        let inventoryChanges: IInventoryChanges = {};

        // If this account is already in a guild, we need to do cleanup first.
        const guildMember = await GuildMember.findOneAndDelete({ accountId: account._id, status: 0 });
        if (guildMember) {
            const inventory = await getInventory(account._id.toString(), "LevelKeys Recipes");
            inventoryChanges = removeDojoKeyItems(inventory);
            await inventory.save();

            if (guildMember.rank == 0) {
                await deleteGuild(guildMember.guildId);
            }
        }

        // Now that we're sure this account is not in a guild right now, we can just proceed with the normal updates.
        invitedGuildMember.status = 0;
        await invitedGuildMember.save();

        // Remove pending applications for this account
        await GuildMember.deleteMany({ accountId: account._id, status: 1 });

        // Update inventory of new member
        const inventory = await getInventory(account._id.toString(), "GuildId LevelKeys Recipes");
        inventory.GuildId = new Types.ObjectId(req.query.clanId as string);
        giveClanKey(inventory, inventoryChanges);
        await inventory.save();

        const guild = (await Guild.findById(req.query.clanId as string))!;

        // Add join to clan log
        guild.RosterActivity ??= [];
        guild.RosterActivity.push({
            dateTime: new Date(),
            entryType: 6,
            details: getSuffixedName(account)
        });
        await guild.save();

        res.json({
            ...(await getGuildClient(guild, account)),
            InventoryChanges: inventoryChanges
        });
    } else {
        res.end();
    }
};

// POST request: Clan representative accepting invite(s).
export const confirmGuildInvitationPostController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const guild = (await Guild.findById(req.query.clanId as string, "Ranks RosterActivity"))!;
    if (!(await hasGuildPermission(guild, accountId, GuildPermission.Recruiter))) {
        res.status(400).json("Invalid permission");
        return;
    }
    const payload = getJSONfromString<{ userId: string }>(String(req.body));
    const filter: { accountId?: string; status: number } = { status: 1 };
    if (payload.userId != "all") {
        filter.accountId = payload.userId;
    }
    const guildMembers = await GuildMember.find(filter);
    const newMembers: string[] = [];
    for (const guildMember of guildMembers) {
        guildMember.status = 0;
        guildMember.RequestMsg = undefined;
        guildMember.RequestExpiry = undefined;
        await guildMember.save();

        // Remove other pending applications for this account
        await GuildMember.deleteMany({ accountId: guildMember.accountId, status: 1 });

        // Update inventory of new member
        const inventory = await getInventory(
            guildMember.accountId.toString(),
            "GuildId LevelKeys Recipes skipClanKeyCrafting"
        );
        inventory.GuildId = new Types.ObjectId(req.query.clanId as string);
        giveClanKey(inventory);
        await inventory.save();

        // Add join to clan log
        const account = (await Account.findOne({ _id: guildMember.accountId }))!;
        guild.RosterActivity ??= [];
        guild.RosterActivity.push({
            dateTime: new Date(),
            entryType: 6,
            details: getSuffixedName(account)
        });

        newMembers.push(account._id.toString());
    }
    await guild.save();
    res.json({
        NewMembers: newMembers
    });
};
