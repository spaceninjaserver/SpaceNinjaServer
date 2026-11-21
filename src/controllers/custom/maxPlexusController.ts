import type { RequestHandler } from "express";
import { BV_LATEST } from "../../constants/gameVersions.ts";
import { applyClientEquipmentUpdates, getInventory2 } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { broadcastInventoryUpdate } from "../../services/wsService.ts";
import type { IEquipmentClient } from "../../types/equipmentTypes.ts";

export const maxPlexusController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory2(accountId, "CrewShipHarnesses", "XPInfo", "infiniteRevives");
    const plexus = inventory.CrewShipHarnesses[0] as (typeof inventory.CrewShipHarnesses)[number] | undefined;
    if (!plexus || (plexus.XP ?? 0) >= 900_000) {
        res.json({ count: 0 });
        return;
    }
    applyClientEquipmentUpdates(
        inventory,
        [{ ItemId: { $oid: plexus._id.toString() }, XP: 900_000 - (plexus.XP ?? 0) } as IEquipmentClient],
        "CrewShipHarnesses",
        BV_LATEST
    );
    await inventory.save();
    res.json({ count: 1 });
    broadcastInventoryUpdate(req);
};
