import { getAccountIdForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { updateTheme } from "@/src/services/inventoryService";
import { IThemeUpdateRequest } from "@/src/types/requestTypes";
import { RequestHandler } from "express";

const updateThemeController: RequestHandler = async (request, response) => {
    const accountId = await getAccountIdForRequest(request);
    const body = String(request.body);

    try {
        const json = getJSONfromString(body) as IThemeUpdateRequest;
        if (typeof json !== "object") {
            throw new Error("Invalid data format");
        }

        await updateTheme(json, accountId);
    } catch (err) {
        console.error("Error parsing JSON data:", err);
    }

    response.json({});
};

export { updateThemeController };
