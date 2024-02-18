/* eslint-disable @typescript-eslint/no-misused-promises */
import { toInventoryResponse } from "@/src/helpers/inventoryHelpers";
import { Inventory } from "@/src/models/inventoryModels/inventoryModel";
import { Request, RequestHandler, Response } from "express";
import config from "@/config.json";
import allMissions from "@/static/fixed_responses/allMissions.json";
import allQuestKeys from "@/static/fixed_responses/allQuestKeys.json";
import allShipDecorations from "@/static/fixed_responses/shipDecorations.json";
import { ILoadoutDatabase } from "@/src/types/saveLoadoutTypes";
import { IShipInventory } from "@/src/types/inventoryTypes/inventoryTypes";

const inventoryController: RequestHandler = async (request: Request, response: Response) => {
    const accountId = request.query.accountId;

    if (!accountId) {
        response.status(400).json({ error: "accountId was not provided" });
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

    if (config.unlockAllMissions) inventoryResponse.Missions = allMissions;
    if (config.unlockAllQuests) inventoryResponse.QuestKeys = allQuestKeys;

    if (config.unlockAllShipDecorations) {
        inventoryResponse.ShipDecorations = allShipDecorations;
    }

    response.json(inventoryResponse);
};

export { inventoryController };
