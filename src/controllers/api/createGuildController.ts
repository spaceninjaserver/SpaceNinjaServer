import type { RequestHandler } from "express";
import { getAccountForRequest, type TAccountDocument } from "../../services/loginService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { Guild, GuildMember } from "../../models/guildModel.ts";
import { createUniqueClanName, getGuildClient, giveClanKey } from "../../services/guildService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import type { IInventoryChanges } from "../../types/purchaseTypes.ts";
import { sendWsBroadcastTo } from "../../services/wsService.ts";
import type { IGuildClient } from "../../types/guildTypes.ts";

export const createGuildGetController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const guildName = req.query.guildName as string;
    const response = processCreateGuildRequest(account, { guildName });
    res.json(response);
};

export const createGuildPostController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const payload = getJSONfromString<ICreateGuildRequest>(String(req.body));
    const response = processCreateGuildRequest(account, payload);
    res.json(response);
};

const processCreateGuildRequest = async (
    account: TAccountDocument,
    payload: ICreateGuildRequest
): Promise<ICreateGuildResponse> => {
    const inventory = await getInventory(account._id.toString(), "GuildId LevelKeys Recipes");
    if (inventory.GuildId) {
        const guild = await Guild.findById(inventory.GuildId);
        if (guild) {
            return {
                ...(await getGuildClient(guild, account))
            };
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

    sendWsBroadcastTo(account._id.toString(), { update_inventory: true });
    return {
        ...(await getGuildClient(guild, account)),
        InventoryChanges: inventoryChanges
    };
};

interface ICreateGuildRequest {
    guildName: string;
}

interface ICreateGuildResponse extends IGuildClient {
    InventoryChanges?: IInventoryChanges;
}
