import { GuildMember } from "@/src/models/guildModel";
import { Account } from "@/src/models/loginModel";
import { getGuildForRequest } from "@/src/services/guildService";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountForRequest, getSuffixedName } from "@/src/services/loginService";
import { RequestHandler } from "express";

export const removeFromGuildController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const guild = await getGuildForRequest(req);
    // TODO: Check permissions
    const payload = JSON.parse(String(req.body)) as IRemoveFromGuildRequest;

    const guildMember = (await GuildMember.findOne({ accountId: payload.userId, guildId: guild._id }))!;
    if (guildMember.status == 0) {
        const inventory = await getInventory(payload.userId);
        inventory.GuildId = undefined;

        // Remove clan key or blueprint from kicked member
        const itemIndex = inventory.MiscItems.findIndex(x => x.ItemType == "/Lotus/Types/Keys/DojoKey");
        if (itemIndex != -1) {
            inventory.MiscItems.splice(itemIndex, 1);
        } else {
            const recipeIndex = inventory.Recipes.findIndex(x => x.ItemType == "/Lotus/Types/Keys/DojoKeyBlueprint");
            if (recipeIndex != -1) {
                inventory.Recipes.splice(itemIndex, 1);
            }
        }

        await inventory.save();

        // TODO: Handle clan leader kicking themselves (guild should be deleted in this case, I think)
    } else if (guildMember.status == 2) {
        // TODO: Maybe the inbox message for the sent invite should be deleted?
    }
    await GuildMember.deleteOne({ _id: guildMember._id });

    guild.RosterActivity ??= [];
    if (account._id.equals(payload.userId)) {
        // Leave
        guild.RosterActivity.push({
            dateTime: new Date(),
            entryType: 7,
            details: getSuffixedName(account)
        });
    } else {
        // Kick
        const kickee = (await Account.findOne({ _id: payload.userId }))!;
        guild.RosterActivity.push({
            dateTime: new Date(),
            entryType: 12,
            details: getSuffixedName(kickee) + "," + getSuffixedName(account)
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
