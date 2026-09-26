import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getInventory } from "../../services/inventoryService.ts";
import type { RequestHandler } from "express";
import type { IMiscAccountData, ITennoCon2026Cust } from "../../types/inventoryTypes/inventoryTypes.ts";

export const saveMiscDataController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const payload = getJSONfromString<IMiscAccountData>(String(req.body));
    const inventory = await getInventory(accountId, "MiscAccountData VesselCustomization");
    if (payload.PropertyName == "TennoCon2026Cust") {
        const { VesselBodyMale, pricol } = JSON.parse(payload.Json) as ITennoCon2026Cust;
        inventory.VesselCustomization = {
            Customization: { pricol },
            IsMale: VesselBodyMale ?? true
        };
        inventory.MiscAccountData = inventory.MiscAccountData?.filter(d => d.PropertyName != "TennoCon2026Cust");
    } else {
        inventory.MiscAccountData ??= [];
        const existing = inventory.MiscAccountData.find(d => d.PropertyName == payload.PropertyName);
        if (existing) {
            existing.Json = payload.Json;
        } else {
            inventory.MiscAccountData.push(payload);
        }
    }
    await inventory.save();
    res.json({});
};
