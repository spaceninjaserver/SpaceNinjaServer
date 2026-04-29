import { getAccountIdForRequest } from "../../services/loginService.ts";
import { updateGeneric } from "../../services/inventoryService.ts";
import type { RequestHandler } from "express";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import type { IGenericUpdate } from "../../types/genericUpdateTypes.ts";

// This endpoint used to be /api/genericUpdate.php, but sometime around the Jade Shadows update, it was changed to /api/updateNodeIntros.php.
// SpaceNinjaServer supports both endpoints right now.

export const genericUpdateController: RequestHandler = async (request, response) => {
    const accountId = await getAccountIdForRequest(request);
    const update = getJSONfromString<IGenericUpdate>(String(request.body));
    response.json(await updateGeneric(accountId, update));
};
