/* eslint-disable @typescript-eslint/no-misused-promises */
import { toInventoryResponse } from "@/src/helpers/inventoryHelpers";
import { Inventory } from "@/src/models/inventoryModels/inventoryModel";
import { Request, RequestHandler, Response } from "express";
import config from "@/config.json";
import testMissions from "@/static/fixed_responses/testMissions.json";
import testQuestKeys from "@/static/fixed_responses/testQuestKeys.json";
import { ILoadoutDatabase } from "@/src/types/saveLoadoutTypes";

const inventoryController: RequestHandler = async (request: Request, response: Response) => {
    const accountId = request.query.accountId;

    if (!accountId) {
        response.status(400).json({ error: "accountId was not provided" });
        return;
    }

    const inventory = await Inventory.findOne({ accountOwnerId: accountId }).populate<{
        LoadOutPresets: ILoadoutDatabase;
    }>("LoadOutPresets");

    if (!inventory) {
        response.status(400).json({ error: "inventory was undefined" });
        return;
    }

    const inventoryJSON = inventory.toJSON();

    const inventoryResponse = toInventoryResponse(inventoryJSON);

    if (config.testMission) inventoryResponse.Missions = testMissions;
    if (config.testQuestKey) inventoryResponse.QuestKeys = testQuestKeys;

    inventoryResponse.DuviriInfo = { Seed: -123123123123123123, NumCompletions: 0 };
    response.json(inventoryResponse);
};

export { inventoryController };
