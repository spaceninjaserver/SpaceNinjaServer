/* eslint-disable @typescript-eslint/no-misused-promises */
import { toInventoryResponse } from "@/src/helpers/inventoryHelpers";
import { Inventory } from "@/src/models/inventoryModel";
import { Request, RequestHandler, Response } from "express";
import config from "@/config.json";
import testMissions from "@/static/fixed_responses/testMissions.json";
import testQuestKeys from "@/static/fixed_responses/testQuestKeys.json";
import testInventory from "../../../static/testInventory.json";

const inventoryController: RequestHandler = async (request: Request, response: Response) => {
    const accountId = request.query.accountId;

    if (!accountId) {
        response.status(400).json({ error: "accountId was not provided" });
        return;
    }

    const inventory = await Inventory.findOne({ accountOwnerId: accountId });

    if (!inventory) {
        response.status(400).json({ error: "inventory was undefined" });
        return;
    }

    const inventoryJSON = inventory.toJSON();

    const inventoryResponse = toInventoryResponse(inventoryJSON);

    if (config.testMission) inventoryResponse.Missions = testMissions;
    if (config.testQuestKey) inventoryResponse.QuestKeys = testQuestKeys;

    const now = Math.floor(Date.now()) - 129600;
    const date: string = (now + 24 * 60 * 60 * 1000).toString();
    inventoryResponse.TrainingDate = { $date: { $numberLong: "1693769173000" } };
    console.log(inventoryResponse.TrainingDate);
    response.json(inventoryResponse);
};

export { inventoryController };
