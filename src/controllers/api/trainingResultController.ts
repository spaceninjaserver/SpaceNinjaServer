import { parseString } from "@/src/helpers/general";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { Inventory } from "@/src/models/inventoryModel";
import { getInventory } from "@/src/services/inventoryService";
import { RequestHandler } from "express";

interface ITrainingResultsRequest {
    numLevelsGained: number;
}

const epochDay = 86400 * 1000; // in ms
const timeNow = Date.now() + epochDay;

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const trainingResultController: RequestHandler = async (req, res): Promise<void> => {
    console.log(req.body.toString());
    const accountId = parseString(req.query.accountId);

    const trainingResults = getJSONfromString(req.body.toString()) as ITrainingResultsRequest;

    const nextTrainingDate = Date.now().toString;

    if (trainingResults.numLevelsGained == 0) {
        res.json({
            NewTrainingDate: {
                $date: { $numberLong: nextTrainingDate }
            },
            NewLevel: 0,
            InventoryChanges: []
        });
    }

    const inventory = await getInventory(accountId);

    console.log("inventory", inventory.TrainingDate);
    inventory.TrainingDate = new Date(Date.now() + epochDay * 500);
    console.log("inventory after", inventory.TrainingDate);
    await inventory.save();

    if (trainingResults.numLevelsGained == 1) {
        res.json({
            NewTrainingDate: {
                $date: { $numberLong: nextTrainingDate }
            },
            NewLevel: 1,
            InventoryChanges: []
        });
    }
};

export { trainingResultController };
