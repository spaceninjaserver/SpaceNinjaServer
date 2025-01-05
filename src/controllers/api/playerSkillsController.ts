import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { IPlayerSkills } from "@/src/types/inventoryTypes/inventoryTypes";
import { RequestHandler } from "express";

export const playerSkillsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const request = getJSONfromString(String(req.body)) as IPlayerSkillsRequest;

    const oldRank: number = inventory.PlayerSkills[request.Skill as keyof IPlayerSkills];
    const cost = (1 << oldRank) * 1000;
    inventory.PlayerSkills[request.Pool as keyof IPlayerSkills] -= cost;
    inventory.PlayerSkills[request.Skill as keyof IPlayerSkills]++;
    await inventory.save();

    res.json({
        Pool: request.Pool,
        PoolInc: -cost,
        Skill: request.Skill,
        Rank: oldRank + 1
    });
};

interface IPlayerSkillsRequest {
    Pool: string;
    Skill: string;
}
