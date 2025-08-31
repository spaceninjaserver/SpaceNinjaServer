import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getInventory } from "../../services/inventoryService.ts";

export const unlockAllSimarisResearchEntriesController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId, "LibraryPersonalTarget LibraryPersonalProgress");
    inventory.LibraryPersonalTarget = undefined;
    inventory.LibraryPersonalProgress = [
        "/Lotus/Types/Game/Library/Targets/Research1Target",
        "/Lotus/Types/Game/Library/Targets/Research2Target",
        "/Lotus/Types/Game/Library/Targets/Research3Target",
        "/Lotus/Types/Game/Library/Targets/Research4Target",
        "/Lotus/Types/Game/Library/Targets/Research5Target",
        "/Lotus/Types/Game/Library/Targets/Research6Target",
        "/Lotus/Types/Game/Library/Targets/Research7Target"
    ].map(type => ({ TargetType: type, Scans: 10, Completed: true }));
    await inventory.save();
    res.end();
};
