import inventory from "@/static/fixed_responses/inventory.json";
import { Request, RequestHandler, Response } from "express";

const inventoryController: RequestHandler = (request: Request, response: Response) => {
    console.log(request.query);
    const accountId = request.query.accountId;
    console.log(accountId);
    response.json(inventory);
};

export { inventoryController };
