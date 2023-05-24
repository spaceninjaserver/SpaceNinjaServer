import { Request, Response, RequestHandler } from "express";

import inventory from "@/static/fixed_responses/inventory.json";

const inventorController: RequestHandler = (request: Request, response: Response) => {
    console.log(request.query);
    const accountId = request.query.accountId;
    console.log(accountId);
    response.json(inventory);
};

export default inventorController;
