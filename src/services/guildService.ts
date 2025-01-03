import { Request } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";
import { Guild } from "@/src/models/guildModel";
import { TInventoryDatabaseDocument } from "@/src/models/inventoryModels/inventoryModel";

export const getGuildForRequest = async (req: Request) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    return await getGuildForRequestEx(req, inventory);
};

export const getGuildForRequestEx = async (req: Request, inventory: TInventoryDatabaseDocument) => {
    const guildId = req.query.guildId as string;
    if (!inventory.GuildId || inventory.GuildId.toString() != guildId) {
        throw new Error("Account is not in the guild that it has sent a request for");
    }
    const guild = await Guild.findOne({ _id: guildId });
    if (!guild) {
        throw new Error("Account thinks it is in a guild that doesn't exist");
    }
    return guild;
};
