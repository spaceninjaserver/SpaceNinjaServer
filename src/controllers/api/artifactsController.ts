import { upgradeMod } from "@/src/services/inventoryService";
import { RequestHandler } from "express";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const artifactsController: RequestHandler = async (req, res) => {
    const [data] = String(req.body).split("\n");
    const id = req.query.accountId as string;

    // TODO - salt check

    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const parsedData = JSON.parse(data);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const upgradeModId = await upgradeMod(parsedData, id);
        res.send(upgradeModId);
    } catch (err) {
        console.error("Error parsing JSON data:", err);
    }
};

export { artifactsController };
