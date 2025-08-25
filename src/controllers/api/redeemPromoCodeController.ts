import { getJSONfromString } from "@/src/helpers/stringHelpers";
import type { RequestHandler } from "express";
import glyphCodes from "@/static/fixed_responses/glyphsCodes.json";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { addItem, getInventory } from "@/src/services/inventoryService";

export const redeemPromoCodeController: RequestHandler = async (req, res) => {
    const body = getJSONfromString<IRedeemPromoCodeRequest>(String(req.body));
    if (!(body.codeId in glyphCodes)) {
        res.status(400).send("INVALID_CODE").end();
        return;
    }
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "FlavourItems");
    const acquiredGlyphs: string[] = [];
    for (const glyph of (glyphCodes as Record<string, string[]>)[body.codeId]) {
        if (!inventory.FlavourItems.find(x => x.ItemType == glyph)) {
            acquiredGlyphs.push(glyph);
            await addItem(inventory, glyph);
        }
    }
    if (acquiredGlyphs.length == 0) {
        res.status(400).send("USED_CODE").end();
        return;
    }
    await inventory.save();
    res.json({
        FlavourItems: acquiredGlyphs
    });
};

interface IRedeemPromoCodeRequest {
    codeId: string;
}
