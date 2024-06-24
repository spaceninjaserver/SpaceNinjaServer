import { getAccountIdForRequest } from "@/src/services/loginService";
import { updateGeneric } from "@/src/services/inventoryService";
import { RequestHandler } from "express";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { IGenericUpdate } from "@/src/types/genericUpdate";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const genericUpdateController: RequestHandler = async (request, response) => {
    const accountId = await getAccountIdForRequest(request);
    const update = getJSONfromString(String(request.body)) as IGenericUpdate;
    response.json(await updateGeneric(update, accountId));
};

export { genericUpdateController };
