import type { RequestHandler } from "express";
import { getAccountForRequest } from "../../services/loginService.ts";
import { version_compare } from "../../helpers/inventoryHelpers.ts";
import gameToBuildVersion from "../../../static/fixed_responses/gameToBuildVersion.json" with { type: "json" };

export const getSkuCatalogController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    if (!account.BuildLabel || version_compare(account.BuildLabel, gameToBuildVersion["40.0.0"]) >= 0) {
        res.sendFile("static/fixed_responses/getSkuCatalogU40.json", { root: "./" });
    } else {
        res.sendFile("static/fixed_responses/getSkuCatalog.json", { root: "./" });
    }
};
