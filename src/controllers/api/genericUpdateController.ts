import { getAccountIdForRequest } from "@/src/services/loginService";
import { updateGeneric } from "@/src/services/inventoryService";
import { RequestHandler } from "express";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { IGenericUpdate } from "@/src/types/genericUpdate";

// This endpoint used to be /api/genericUpdate.php, but sometime around the Jade Shadows update, it was changed to /api/updateNodeIntros.php.
// SpaceNinjaServer supports both endpoints right now.

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const genericUpdateController: RequestHandler = async (request, response) => {
    const accountId = await getAccountIdForRequest(request);
    const update = getJSONfromString(String(request.body)) as IGenericUpdate;
    response.json(await updateGeneric(update, accountId));
};

export { genericUpdateController };
