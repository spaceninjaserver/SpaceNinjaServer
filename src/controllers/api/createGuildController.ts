import { RequestHandler } from "express";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { Inventory } from "@/src/models/inventoryModels/inventoryModel";
import { Guild } from "@/src/models/guildModel";
import { IGuild, ICreateGuildRequest } from "@/src/types/guildTypes";

const createGuildController: RequestHandler = async (req, res) => {
    const payload: ICreateGuildRequest = getJSONfromString(req.body.toString());

    // Create guild on database
    const guild = new Guild({
        Name: payload.guildName
    } satisfies IGuild);
    await guild.save();

    // Update inventory
    const inventory = await Inventory.findOne({ accountOwnerId: req.query.accountId });
    if (inventory) {
        // Set GuildId
        inventory.GuildId = guild._id;

        // Give clan key
        inventory.LevelKeys ??= [];
        inventory.LevelKeys.push({
            ItemType: "/Lotus/Types/Keys/DojoKey",
            ItemCount: 1
        });

        await inventory.save();
    }

    res.json(guild);
};

export { createGuildController };
