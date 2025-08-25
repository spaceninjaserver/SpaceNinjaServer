import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import type { IAlignment } from "@/src/types/inventoryTypes/inventoryTypes";
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
