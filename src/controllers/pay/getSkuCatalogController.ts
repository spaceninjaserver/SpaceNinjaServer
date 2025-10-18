import type { RequestHandler } from "express";
import { getAccountForRequest } from "../../services/loginService.ts";
import { version_compare } from "../../helpers/inventoryHelpers.ts";

export const getSkuCatalogController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (!account.BuildLabel || version_compare(account.BuildLabel, "2025.10.14.16.10") >= 0) {
        res.sendFile("static/fixed_responses/getSkuCatalogU40.json", { root: "./" });
    } else {
        res.sendFile("static/fixed_responses/getSkuCatalog.json", { root: "./" });
    }
};
