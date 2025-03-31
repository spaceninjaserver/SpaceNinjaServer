import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { Inventory } from "@/src/models/inventoryModels/inventoryModel";
import { equipmentKeys, TEquipmentKey } from "@/src/types/inventoryTypes/inventoryTypes";

export const setWeaponSkillTreeController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const payload = getJSONfromString<ISetWeaponSkillTreeRequest>(String(req.body));

    if (equipmentKeys.indexOf(req.query.Category as TEquipmentKey) != -1) {
        await Inventory.updateOne(
            {
                accountOwnerId: accountId,
                [`${req.query.Category as string}._id`]: req.query.ItemId as string
            },
            {
                [`${req.query.Category as string}.$.SkillTree`]: payload.SkillTree
            }
        );
    }

    res.end();
};

interface ISetWeaponSkillTreeRequest {
    SkillTree: string;
}
