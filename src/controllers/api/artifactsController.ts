import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { upgradeMod } from "@/src/services/inventoryService";
import { IArtifactsRequest } from "@/src/types/requestTypes";
import { RequestHandler } from "express";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const artifactsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);

    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
        const artifactsData = getJSONfromString(req.body.toString()) as IArtifactsRequest;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const upgradeModId = await upgradeMod(artifactsData, accountId);
        res.send(upgradeModId);
    } catch (err) {
        console.error("Error parsing JSON data:", err);
    }
};

export { artifactsController };
