import { toMongoDate } from "@/src/helpers/inventoryHelpers";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getInventory } from "@/src/services/inventoryService";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";

export const entratiLabConquestModeController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(
        accountId,
        "EntratiVaultCountResetDate EntratiVaultCountLastPeriod EntratiLabConquestUnlocked EchoesHexConquestUnlocked EchoesHexConquestActiveFrameVariants EchoesHexConquestActiveStickers EntratiLabConquestActiveFrameVariants EntratiLabConquestCacheScoreMission EchoesHexConquestCacheScoreMission"
    );
    const body = getJSONfromString<IEntratiLabConquestModeRequest>(String(req.body));
    if (!inventory.EntratiVaultCountResetDate || Date.now() >= inventory.EntratiVaultCountResetDate.getTime()) {
        const EPOCH = 1734307200 * 1000; // Mondays, amirite?
        const day = Math.trunc((Date.now() - EPOCH) / 86400000);
        const week = Math.trunc(day / 7);
        const weekStart = EPOCH + week * 604800000;
        const weekEnd = weekStart + 604800000;
        inventory.EntratiVaultCountLastPeriod = 0;
        inventory.EntratiVaultCountResetDate = new Date(weekEnd);
        if (inventory.EntratiLabConquestUnlocked) {
            inventory.EntratiLabConquestUnlocked = 0;
            inventory.EntratiLabConquestCacheScoreMission = 0;
            inventory.EntratiLabConquestActiveFrameVariants = [];
        }
        if (inventory.EchoesHexConquestUnlocked) {
            inventory.EchoesHexConquestUnlocked = 0;
            inventory.EchoesHexConquestCacheScoreMission = 0;
            inventory.EchoesHexConquestActiveFrameVariants = [];
            inventory.EchoesHexConquestActiveStickers = [];
        }
    }
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
        EntratiVaultCountResetDate: toMongoDate(inventory.EntratiVaultCountResetDate),
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
