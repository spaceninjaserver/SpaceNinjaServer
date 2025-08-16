import { RequestHandler } from "express";
import { getAccountForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";
import { Guild } from "@/src/models/guildModel";

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
