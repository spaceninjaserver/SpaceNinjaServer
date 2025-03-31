import { Guild, GuildMember } from "@/src/models/guildModel";
import { deleteGuild, getGuildClient, removeDojoKeyItems } from "@/src/services/guildService";
import { addRecipes, combineInventoryChanges, getInventory } from "@/src/services/inventoryService";
import { getAccountForRequest, getSuffixedName } from "@/src/services/loginService";
import { IInventoryChanges } from "@/src/types/purchaseTypes";
import { RequestHandler } from "express";
import { Types } from "mongoose";

export const confirmGuildInvitationController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const invitedGuildMember = await GuildMember.findOne({
        accountId: account._id,
        guildId: req.query.clanId as string
    });
    if (invitedGuildMember) {
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

        const inventory = await getInventory(account._id.toString(), "GuildId LevelKeys Recipes");
        inventory.GuildId = new Types.ObjectId(req.query.clanId as string);
        const recipeChanges = [
            {
                ItemType: "/Lotus/Types/Keys/DojoKeyBlueprint",
                ItemCount: 1
            }
        ];
        addRecipes(inventory, recipeChanges);
        combineInventoryChanges(inventoryChanges, { Recipes: recipeChanges });
        await inventory.save();

        const guild = (await Guild.findById(req.query.clanId as string))!;

        guild.RosterActivity ??= [];
        guild.RosterActivity.push({
            dateTime: new Date(),
            entryType: 6,
            details: getSuffixedName(account)
        });
        await guild.save();

        res.json({
            ...(await getGuildClient(guild, account._id.toString())),
            InventoryChanges: inventoryChanges
        });
    } else {
        res.end();
    }
};
