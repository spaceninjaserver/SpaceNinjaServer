/* eslint-disable @typescript-eslint/no-misused-promises */
import { getAccountIdForRequest } from "@/src/services/loginService";
import { toInventoryResponse } from "@/src/helpers/inventoryHelpers";
import { Inventory } from "@/src/models/inventoryModels/inventoryModel";
import { Request, RequestHandler, Response } from "express";
import { config } from "@/src/services/configService";
import allMissions from "@/static/fixed_responses/allMissions.json";
import allQuestKeys from "@/static/fixed_responses/allQuestKeys.json";
import allShipDecorations from "@/static/fixed_responses/allShipDecorations.json";
import allFlavourItems from "@/static/fixed_responses/allFlavourItems.json";
import allSkins from "@/static/fixed_responses/allSkins.json";
import { ILoadoutDatabase } from "@/src/types/saveLoadoutTypes";
import { IShipInventory, IFlavourItem } from "@/src/types/inventoryTypes/inventoryTypes";

const inventoryController: RequestHandler = async (request: Request, response: Response) => {
    let accountId;
    try {
        accountId = await getAccountIdForRequest(request);
    } catch (e) {
        response.status(400).send("Log-in expired");
        return;
    }

    const inventory = await Inventory.findOne({ accountOwnerId: accountId })
        .populate<{
            LoadOutPresets: ILoadoutDatabase;
        }>("LoadOutPresets")
        .populate<{ Ships: IShipInventory }>("Ships", "-ShipInteriorColors");

    if (!inventory) {
        response.status(400).json({ error: "inventory was undefined" });
        return;
    }

    //TODO: make a function that converts from database representation to client
    const inventoryJSON = inventory.toJSON();
    console.log(inventoryJSON.Ships);

    const inventoryResponse = toInventoryResponse(inventoryJSON);

    if (config.infiniteResources) {
        inventoryResponse.RegularCredits = 999999999;
        inventoryResponse.TradesRemaining = 999999999;
        inventoryResponse.PremiumCreditsFree = 999999999;
        inventoryResponse.PremiumCredits = 999999999;
    }

    if (config.unlockAllMissions) {
        inventoryResponse.Missions = allMissions;
        inventoryResponse.NodeIntrosCompleted.push("TeshinHardModeUnlocked");
    }

    if (config.unlockAllQuests) {
        for (const questKey of allQuestKeys) {
            if (!inventoryResponse.QuestKeys.find(quest => quest.ItemType == questKey)) {
                inventoryResponse.QuestKeys.push({ ItemType: questKey });
            }
        }
    }
    if (config.completeAllQuests) {
        for (const quest of inventoryResponse.QuestKeys) {
            quest.Completed = true;
            quest.Progress = [
                {
                    c: 0,
                    i: false,
                    m: false,
                    b: []
                }
            ];
        }
    }

    if (config.unlockAllShipDecorations) inventoryResponse.ShipDecorations = allShipDecorations;
    if (config.unlockAllFlavourItems) inventoryResponse.FlavourItems = allFlavourItems satisfies IFlavourItem[];

    if (config.unlockAllSkins) {
        inventoryResponse.WeaponSkins = [];
        for (const skin of allSkins) {
            inventoryResponse.WeaponSkins.push({
                ItemId: {
                    $oid: "000000000000000000000000"
                },
                ItemType: skin
            });
        }
    }

    if (typeof config.spoofMasteryRank === "number" && config.spoofMasteryRank >= 0) {
        inventoryResponse.PlayerLevel = config.spoofMasteryRank;
        if (!("xpBasedLevelCapDisabled" in request.query)) {
            // This client has not been patched to accept any mastery rank, need to fake the XP.
            inventoryResponse.XPInfo = [];
            let numFrames = getExpRequiredForMr(Math.min(config.spoofMasteryRank, 5030)) / 6000;
            while (numFrames-- > 0) {
                inventoryResponse.XPInfo.push({
                    ItemType: "/Lotus/Powersuits/Mag/Mag",
                    XP: 1_600_000
                });
            }
        }
    }

    response.json(inventoryResponse);
};

const getExpRequiredForMr = (rank: number): number => {
    if (rank <= 30) {
        return 2500 * rank * rank;
    }
    return 2_250_000 + 147_500 * (rank - 30);
};

export { inventoryController };
