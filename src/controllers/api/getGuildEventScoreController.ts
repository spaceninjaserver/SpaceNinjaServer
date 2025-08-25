import type { RequestHandler } from "express";
import { getAccountForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { Guild } from "../../models/guildModel.ts";

export const getGuildEventScoreController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const inventory = await getInventory(account._id.toString(), "GuildId");
    const guild = await Guild.findById(inventory.GuildId);
    const goalId = req.query.goalId as string;
    if (guild && guild.GoalProgress && goalId) {
        const goal = guild.GoalProgress.find(x => x.goalId.toString() == goalId);
        if (goal) {
            res.json({
                Tier: guild.Tier,
                GoalProgress: {
                    Count: goal.Count,
                    Tag: goal.Tag,
                    _id: { $oid: goal.goalId }
                }
            });
            return;
        }
    }
    res.json({});
};
