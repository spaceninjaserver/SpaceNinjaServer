import { getAccountIdForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { getInventory } from "@/src/services/inventoryService";
import { IMongoDate } from "@/src/types/commonTypes";
import { RequestHandler } from "express";
import { unixTimesInMs } from "@/src/constants/timeConstants";

interface ITrainingResultsRequest {
    numLevelsGained: number;
}

interface ITrainingResultsResponse {
    NewTrainingDate: IMongoDate;
    NewLevel: number;
    InventoryChanges: any[];
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const trainingResultController: RequestHandler = async (req, res): Promise<void> => {
    const accountId = await getAccountIdForRequest(req);

    const trainingResults = getJSONfromString(String(req.body)) as ITrainingResultsRequest;

    const inventory = await getInventory(accountId);

    inventory.TrainingDate = new Date(Date.now() + unixTimesInMs.day);

    if (trainingResults.numLevelsGained == 1) {
        inventory.PlayerLevel += 1;
    }

    const changedinventory = await inventory.save();

    res.json({
        NewTrainingDate: {
            $date: { $numberLong: changedinventory.TrainingDate.getTime().toString() }
        },
        NewLevel: trainingResults.numLevelsGained == 1 ? changedinventory.PlayerLevel : inventory.PlayerLevel,
        InventoryChanges: []
    } satisfies ITrainingResultsResponse);
};

export { trainingResultController };
