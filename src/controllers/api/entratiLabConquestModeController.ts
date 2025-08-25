import { toMongoDate } from "../../helpers/inventoryHelpers.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { getInventory, updateEntratiVault } from "../../services/inventoryService.ts";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import type { RequestHandler } from "express";

export const entratiLabConquestModeController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(
        accountId,
        "EntratiVaultCountResetDate EntratiVaultCountLastPeriod EntratiLabConquestUnlocked EchoesHexConquestUnlocked EchoesHexConquestActiveFrameVariants EchoesHexConquestActiveStickers EntratiLabConquestActiveFrameVariants EntratiLabConquestCacheScoreMission EchoesHexConquestCacheScoreMission"
    );
    const body = getJSONfromString<IEntratiLabConquestModeRequest>(String(req.body));
    updateEntratiVault(inventory);
    if (body.BuyMode) {
        inventory.EntratiVaultCountLastPeriod! += 2;
        if (body.IsEchoesDeepArchemedea) {
            inventory.EchoesHexConquestUnlocked = 1;
        } else {
            inventory.EntratiLabConquestUnlocked = 1;
        }
    }
    if (body.IsEchoesDeepArchemedea) {
        if (inventory.EchoesHexConquestUnlocked) {
            inventory.EchoesHexConquestActiveFrameVariants = body.EchoesHexConquestActiveFrameVariants!;
            inventory.EchoesHexConquestActiveStickers = body.EchoesHexConquestActiveStickers!;
        }
    } else {
        if (inventory.EntratiLabConquestUnlocked) {
            inventory.EntratiLabConquestActiveFrameVariants = body.EntratiLabConquestActiveFrameVariants!;
        }
    }
    await inventory.save();
    res.json({
        EntratiVaultCountResetDate: toMongoDate(inventory.EntratiVaultCountResetDate!),
        EntratiVaultCountLastPeriod: inventory.EntratiVaultCountLastPeriod,
        EntratiLabConquestUnlocked: inventory.EntratiLabConquestUnlocked,
        EntratiLabConquestCacheScoreMission: inventory.EntratiLabConquestCacheScoreMission,
        EchoesHexConquestUnlocked: inventory.EchoesHexConquestUnlocked,
        EchoesHexConquestCacheScoreMission: inventory.EchoesHexConquestCacheScoreMission
    });
};

interface IEntratiLabConquestModeRequest {
    BuyMode?: number;
    IsEchoesDeepArchemedea?: number;
    EntratiLabConquestUnlocked?: number;
    EntratiLabConquestActiveFrameVariants?: string[];
    EchoesHexConquestUnlocked?: number;
    EchoesHexConquestActiveFrameVariants?: string[];
    EchoesHexConquestActiveStickers?: string[];
}
