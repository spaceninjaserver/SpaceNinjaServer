import type { RequestHandler } from "express";
import { getAccountForRequest, getBuildVersion } from "../../services/loginService.ts";
import gameToBuildVersionInt from "../../constants/gameToBuildVersionInt.ts";

export const getSkuCatalogController: RequestHandler = async (req, res) => {
    const account = await getAccountForRequest(req);
    const buildVersion = getBuildVersion(req, account);
    if (buildVersion >= gameToBuildVersionInt["40.0.0"]) {
        res.sendFile("static/fixed_responses/getSkuCatalogU40.json", { root: "./" });
    } else {
        res.sendFile("static/fixed_responses/getSkuCatalog.json", { root: "./" });
    }
};
