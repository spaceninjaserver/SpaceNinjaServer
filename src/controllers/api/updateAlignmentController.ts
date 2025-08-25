import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getInventory } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { IAlignment } from "../../types/inventoryTypes/inventoryTypes.ts";
import type { RequestHandler } from "express";

export const updateAlignmentController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const body = getJSONfromString<IUpdateAlignmentRequest>(String(req.body));
    inventory.Alignment = {
        Alignment: body.Alignment,
        Wisdom: body.Wisdom
    };
    await inventory.save();
    res.json(inventory.Alignment);
};

interface IUpdateAlignmentRequest {
    Wisdom: number;
    Alignment: number;
    PreviousAlignment: IAlignment;
    AlignmentAction: string; // e.g. "/Lotus/Language/Game/MawCinematicDualChoice"
    KeyChainName: string;
}
