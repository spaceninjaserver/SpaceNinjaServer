/* eslint-disable @typescript-eslint/no-misused-promises */
import { toInventoryResponse } from "@/src/helpers/inventoryHelpers";
import { Inventory } from "@/src/models/inventoryModel";
import { Request, RequestHandler, Response } from "express";

const inventoryController: RequestHandler = async (request: Request, response: Response) => {
    const accountId = request.query.accountId;

    if (!accountId) {
        response.status(400).json({ error: "accountId was not provided" });
        return;
    }
    console.log(accountId);

    const inventory = await Inventory.findOne({ accountOwnerId: accountId }); // has the accountOwnerId field to find a corresponding inventory

    if (!inventory) {
        response.status(400).json({ error: "inventory was undefined" });
        return;
    }

    const inventoryJSON = inventory.toJSON();

    const inventoreResponse = toInventoryResponse(inventoryJSON); // remove the accountOwnerId for the response

    response.json(inventoreResponse);
};

export { inventoryController };
