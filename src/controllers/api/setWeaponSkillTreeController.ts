import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { WeaponTypeInternal } from "@/src/services/itemDataService";

export const setWeaponSkillTreeController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const payload = getJSONfromString(String(req.body)) as ISetWeaponSkillTreeRequest;

    const item = inventory[req.query.Category as WeaponTypeInternal].find(
        item => item._id.toString() == (req.query.ItemId as string)
    )!;
    item.SkillTree = payload.SkillTree;

    await inventory.save();
    res.end();
};

interface ISetWeaponSkillTreeRequest {
    SkillTree: string;
}
