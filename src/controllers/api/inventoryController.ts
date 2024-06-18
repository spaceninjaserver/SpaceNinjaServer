/* eslint-disable @typescript-eslint/no-misused-promises */
import { getAccountIdForRequest } from "@/src/services/loginService";
import { toInventoryResponse } from "@/src/helpers/inventoryHelpers";
import { Inventory } from "@/src/models/inventoryModels/inventoryModel";
import { Request, RequestHandler, Response } from "express";
import { config } from "@/src/services/configService";
import allMissions from "@/static/fixed_responses/allMissions.json";
import allShipDecorations from "@/static/fixed_responses/allShipDecorations.json";
import { ILoadoutDatabase } from "@/src/types/saveLoadoutTypes";
import { IShipInventory } from "@/src/types/inventoryTypes/inventoryTypes";
import { ExportCustoms, ExportFlavour, ExportKeys } from "warframe-public-export-plus";

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
        for (const [k, v] of Object.entries(ExportKeys)) {
            if ("chainStages" in v) {
                if (!inventoryResponse.QuestKeys.find(quest => quest.ItemType == k)) {
                    inventoryResponse.QuestKeys.push({ ItemType: k });
                }
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

        inventoryResponse.ArchwingEnabled = true;

        // Skip "Watch The Maker"
        inventoryResponse.NodeIntrosCompleted.push("/Lotus/Levels/Cinematics/NewWarIntro/NewWarStageTwo.level");
    }

    if (config.unlockAllShipDecorations) inventoryResponse.ShipDecorations = allShipDecorations;

    if (config.unlockAllFlavourItems) {
        inventoryResponse.FlavourItems = [];
        for (const uniqueName in ExportFlavour) {
            inventoryResponse.FlavourItems.push({ ItemType: uniqueName });
        }
    }

    if (config.unlockAllSkins) {
        inventoryResponse.WeaponSkins = [];
        for (const uniqueName in ExportCustoms) {
            inventoryResponse.WeaponSkins.push({
                ItemId: {
                    $oid: "000000000000000000000000"
                },
                ItemType: uniqueName
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
