import type { RequestHandler } from "express";
import { getAccountForRequest } from "../../services/loginService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { Guild, GuildMember } from "../../models/guildModel.ts";
import { createUniqueClanName, getGuildClient, giveClanKey } from "../../services/guildService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import type { IInventoryChanges } from "../../types/purchaseTypes.ts";

export const createGuildController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const payload = getJSONfromString<ICreateGuildRequest>(String(req.body));

    const inventory = await getInventory(account._id.toString(), "GuildId LevelKeys Recipes");
    if (inventory.GuildId) {
        const guild = await Guild.findById(inventory.GuildId);
        if (guild) {
            res.json({
                ...(await getGuildClient(guild, account))
            });
            return;
        }
    }

    // Remove pending applications for this account
    await GuildMember.deleteMany({ accountId: account._id, status: 1 });

    // Create guild on database
    const guild = new Guild({
        Name: await createUniqueClanName(payload.guildName)
    });
    await guild.save();

    // Create guild member on database
    await GuildMember.insertOne({
        accountId: account._id,
        guildId: guild._id,
        status: 0,
        rank: 0
    });

    inventory.GuildId = guild._id;
    const inventoryChanges: IInventoryChanges = {};
    giveClanKey(inventory, inventoryChanges);
    await inventory.save();

    res.json({
        ...(await getGuildClient(guild, account)),
        InventoryChanges: inventoryChanges
    });
};

interface ICreateGuildRequest {
    guildName: string;
}
