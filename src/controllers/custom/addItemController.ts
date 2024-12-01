import { getAccountIdForRequest } from "@/src/services/loginService";
import { toAddItemRequest } from "@/src/helpers/customHelpers/addItemHelpers";
import { addItem } from "@/src/services/inventoryService";
import { RequestHandler } from "express";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const addItemController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const request = toAddItemRequest(req.body);
    const response = await addItem(accountId, request.InternalName, 1, true);
    res.json(response);
    return;
};

export { addItemController };
