import { getAccountIdForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import type { RequestHandler } from "express";
import { getInventory } from "@/src/services/inventoryService";

export const updateThemeController: RequestHandler = async (request, response) => {
    const accountId = await getAccountIdForRequest(request);
    const data = getJSONfromString<IThemeUpdateRequest>(String(request.body));

    const inventory = await getInventory(accountId, "ThemeStyle ThemeBackground ThemeSounds");
    if (data.Style) inventory.ThemeStyle = data.Style;
    if (data.Background) inventory.ThemeBackground = data.Background;
    if (data.Sounds) inventory.ThemeSounds = data.Sounds;
    await inventory.save();

    response.json({});
};

interface IThemeUpdateRequest {
    Style?: string;
    Background?: string;
    Sounds?: string;
}
