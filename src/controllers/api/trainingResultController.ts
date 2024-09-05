import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";
import { IMongoDate } from "@/src/types/commonTypes";
import { RequestHandler } from "express";
import { unixTimesInMs } from "@/src/constants/timeConstants";

interface ITrainingResultsResponse {
    NewTrainingDate: IMongoDate;
    NewLevel: number;
    InventoryChanges: any[];
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const trainingResultController: RequestHandler = async (req, res): Promise<void> => {
    const accountId = await getAccountIdForRequest(req);
    const numLevelsGained = parseInt(req.query.numLevelsGained as string);
    const inventory = await getInventory(accountId);
    console.log(req.query);
    inventory.TrainingDate = new Date(Date.now() + unixTimesInMs.day);

    if (numLevelsGained == 1) {
        inventory.PlayerLevel += 1;
    }

    const changedinventory = await inventory.save();

    res.json({
        NewTrainingDate: {
            $date: { $numberLong: changedinventory.TrainingDate.getTime().toString() }
        },
        NewLevel: numLevelsGained == 1 ? changedinventory.PlayerLevel : inventory.PlayerLevel,
        InventoryChanges: []
    } satisfies ITrainingResultsResponse);
};

export { trainingResultController };
