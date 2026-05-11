import type { RequestHandler } from "express";
import { getAccountForRequest, getBuildLabel } from "../../services/loginService.ts";
import { version_compare } from "../../helpers/inventoryHelpers.ts";
import gameToBuildVersion from "../../constants/gameToBuildVersion.ts";

export const getSkuCatalogController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const buildLabel = getBuildLabel(req, account);
    if (version_compare(buildLabel, gameToBuildVersion["40.0.0"]) >= 0) {
        res.sendFile("static/fixed_responses/getSkuCatalogU40.json", { root: "./" });
    } else {
        res.sendFile("static/fixed_responses/getSkuCatalog.json", { root: "./" });
    }
};
