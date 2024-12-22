import { RequestHandler } from "express";
import { Inventory } from "@/src/models/inventoryModels/inventoryModel";
import { Guild } from "@/src/models/guildModel";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { toOid } from "@/src/helpers/inventoryHelpers";

const getGuildController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await Inventory.findOne({ accountOwnerId: accountId });
    if (!inventory) {
        res.status(400).json({ error: "inventory was undefined" });
        return;
    }
    if (inventory.GuildId) {
        const guild = await Guild.findOne({ _id: inventory.GuildId });
        if (guild) {
            res.json({
                _id: toOid(guild._id),
                Name: guild.Name,
                Members: [
                    {
                        _id: { $oid: req.query.accountId },
                        Rank: 0,
                        Status: 0
                    }
                ],
                Ranks: [
                    {
                        Name: "/Lotus/Language/Game/Rank_Creator",
                        Permissions: 16351
                    },
                    {
                        Name: "/Lotus/Language/Game/Rank_Warlord",
                        Permissions: 14303
                    },
                    {
                        Name: "/Lotus/Language/Game/Rank_General",
                        Permissions: 4318
                    },
                    {
                        Name: "/Lotus/Language/Game/Rank_Officer",
                        Permissions: 4314
                    },
                    {
                        Name: "/Lotus/Language/Game/Rank_Leader",
                        Permissions: 4106
                    },
                    {
                        Name: "/Lotus/Language/Game/Rank_Sage",
                        Permissions: 4304
                    },
                    {
                        Name: "/Lotus/Language/Game/Rank_Soldier",
                        Permissions: 4098
                    },
                    {
                        Name: "/Lotus/Language/Game/Rank_Initiate",
                        Permissions: 4096
                    },
                    {
                        Name: "/Lotus/Language/Game/Rank_Utility",
                        Permissions: 4096
                    }
                ],
                Tier: 1
            });
            return;
        }
    }
    res.json({});
};

export { getGuildController };
