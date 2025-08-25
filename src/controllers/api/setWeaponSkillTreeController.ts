import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { Inventory } from "../../models/inventoryModels/inventoryModel.ts";
import type { TEquipmentKey } from "../../types/inventoryTypes/inventoryTypes.ts";
import { equipmentKeys } from "../../types/inventoryTypes/inventoryTypes.ts";

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
