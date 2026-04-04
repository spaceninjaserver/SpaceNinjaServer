import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { Inventory } from "../../models/inventoryModels/inventoryModel.ts";

export const syncRetroSettingsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const data = JSON.parse(String(req.body)) as ISyncRetroSettingsRequest;
    await Inventory.updateOne(
        {
            accountOwnerId: accountId
        },
        {
            RetroWallpaperId: data.RetroWallpaperId,
            RetroFastTyping: data.RetroFastTyping,
            RetroPlayAllConvos: data.RetroPlayAllConvos,
            RetroDisableKissInboxMessage: data.RetroDisableKissInboxMessage
        }
    );
    res.end();
};

interface ISyncRetroSettingsRequest {
    RetroWallpaperId: number;
    RetroFastTyping: boolean;
    RetroPlayAllConvos: boolean;
    RetroDisableKissInboxMessage: boolean;
}
