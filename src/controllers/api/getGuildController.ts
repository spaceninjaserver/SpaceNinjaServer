import { RequestHandler } from "express";
import { Inventory } from "@/src/models/inventoryModels/inventoryModel";
import { Guild } from "@/src/models/guildModel";
import { guildDbToResponse } from "@/src/types/guildTypes";

const getGuildController: RequestHandler = async (req, res) => {
    if (!req.query.accountId) {
        res.status(400).json({ error: "accountId was not provided" });
        return;
    }
    const inventory = await Inventory.findOne({ accountOwnerId: req.query.accountId });
    if (!inventory) {
        res.status(400).json({ error: "inventory was undefined" });
        return;
    }
    if (inventory.GuildId) {
        const guild = await Guild.findOne({ _id: inventory.GuildId });
        if (guild) {
            res.json(guildDbToResponse(guild));
            return;
        }
    }
    res.json({});
};

export { getGuildController };
