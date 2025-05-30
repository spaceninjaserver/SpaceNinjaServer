import { RequestHandler } from "express";
import { getAccountForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { Guild, GuildMember } from "@/src/models/guildModel";
import { createUniqueClanName, getGuildClient, giveClanKey } from "@/src/services/guildService";
import { getInventory } from "@/src/services/inventoryService";
import { IInventoryChanges } from "@/src/types/purchaseTypes";

export const createGuildController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const payload = getJSONfromString<ICreateGuildRequest>(String(req.body));

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

    const inventory = await getInventory(account._id.toString(), "GuildId LevelKeys Recipes");
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
