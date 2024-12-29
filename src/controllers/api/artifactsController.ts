import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { upgradeMod } from "@/src/services/inventoryService";
import { IArtifactsRequest } from "@/src/types/requestTypes";
import { RequestHandler } from "express";

const artifactsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);

    try {
        const artifactsData = getJSONfromString(String(req.body)) as IArtifactsRequest;
        const upgradeModId = await upgradeMod(artifactsData, accountId);
        res.send(upgradeModId);
    } catch (err) {
        console.error("Error parsing JSON data:", err);
    }
};

export { artifactsController };
