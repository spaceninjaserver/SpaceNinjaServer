import { GuildMember } from "@/src/models/guildModel";
import { Inbox } from "@/src/models/inboxModel";
import { Account } from "@/src/models/loginModel";
import { getGuildForRequest, hasGuildPermission } from "@/src/services/guildService";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountForRequest, getSuffixedName } from "@/src/services/loginService";
import { GuildPermission } from "@/src/types/guildTypes";
import { RequestHandler } from "express";

export const removeFromGuildController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const guild = await getGuildForRequest(req);
    const payload = JSON.parse(String(req.body)) as IRemoveFromGuildRequest;
    const isKick = !account._id.equals(payload.userId);
    if (isKick && !(await hasGuildPermission(guild, account._id, GuildPermission.Regulator))) {
        res.status(400).json("Invalid permission");
        return;
    }

    const guildMember = (await GuildMember.findOne({ accountId: payload.userId, guildId: guild._id }))!;
    if (guildMember.status == 0) {
        const inventory = await getInventory(payload.userId);
        inventory.GuildId = undefined;

        // Remove clan key or blueprint from kicked member
        const itemIndex = inventory.LevelKeys.findIndex(x => x.ItemType == "/Lotus/Types/Keys/DojoKey");
        if (itemIndex != -1) {
            inventory.LevelKeys.splice(itemIndex, 1);
        } else {
            const recipeIndex = inventory.Recipes.findIndex(x => x.ItemType == "/Lotus/Types/Keys/DojoKeyBlueprint");
            if (recipeIndex != -1) {
                inventory.Recipes.splice(recipeIndex, 1);
            }
        }

        await inventory.save();

        // TODO: Handle clan leader kicking themselves (guild should be deleted in this case, I think)
    } else if (guildMember.status == 2) {
        // Delete the inbox message for the invite
        await Inbox.deleteOne({
            ownerId: guildMember.accountId,
            contextInfo: guild._id.toString(),
            acceptAction: "GUILD_INVITE"
        });
    }
    await GuildMember.deleteOne({ _id: guildMember._id });

    guild.RosterActivity ??= [];
    if (isKick) {
        const kickee = (await Account.findById(payload.userId))!;
        guild.RosterActivity.push({
            dateTime: new Date(),
            entryType: 12,
            details: getSuffixedName(kickee) + "," + getSuffixedName(account)
        });
    } else {
        guild.RosterActivity.push({
            dateTime: new Date(),
            entryType: 7,
            details: getSuffixedName(account)
        });
    }
    await guild.save();

    res.json({
        _id: payload.userId,
        ItemToRemove: "/Lotus/Types/Keys/DojoKey",
        RecipeToRemove: "/Lotus/Types/Keys/DojoKeyBlueprint"
    });
};

interface IRemoveFromGuildRequest {
    userId: string;
    kicker?: string;
}
