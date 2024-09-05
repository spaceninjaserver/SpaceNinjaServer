import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { toInventoryResponse } from "@/src/helpers/inventoryHelpers";
import { Inventory } from "@/src/models/inventoryModels/inventoryModel";
import { config } from "@/src/services/configService";
import { IInventoryDatabase } from "@/src/types/inventoryTypes/inventoryTypes";
import { ExportCustoms, ExportFlavour } from "warframe-public-export-plus";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const inventoryController: RequestHandler = async (request, response) => {
    let accountId;
    try {
        accountId = await getAccountIdForRequest(request);
    } catch (e) {
        response.status(400).send("Log-in expired");
        return;
    }

    const inventory = await Inventory.findOne({ accountOwnerId: accountId });

    if (!inventory) {
        response.status(400).json({ error: "inventory was undefined" });
        return;
    }

    //TODO: make a function that converts from database representation to client
    const inventoryJSON: IInventoryDatabase = inventory.toJSON();
    console.log(inventoryJSON.Ships);

    const inventoryResponse = toInventoryResponse(inventoryJSON);

    if (config.infiniteResources) {
        inventoryResponse.RegularCredits = 999999999;
        inventoryResponse.PremiumCredits = 999999999;
    }

    // if (config.unlockAllMissions) {
    //     //inventoryResponse.Missions = allMissions;
    //     //inventoryResponse.NodeIntrosCompleted.push("TeshinHardModeUnlocked");
    // }

    // if (config.unlockAllMissions) {
    //     //inventoryResponse.Missions = allMissions;
    //     //addString(inventoryResponse.NodeIntrosCompleted, "TeshinHardModeUnlocked");
    // }

    // if (config.unlockAllFlavourItems) {
    //     inventoryResponse.FlavourItems = [];
    //     for (const uniqueName in ExportFlavour) {
    //         inventoryResponse.FlavourItems.push({ ItemType: uniqueName });
    //     }
    // }

    // if (config.unlockAllSkins) {
    //     inventoryResponse.WeaponSkins = [];
    //     for (const uniqueName in ExportCustoms) {
    //         inventoryResponse.WeaponSkins.push({
    //             ItemId: {
    //                 $id: "000000000000000000000000"
    //             },
    //             ItemType: uniqueName
    //         });
    //     }
    // }

    if (typeof config.spoofMasteryRank === "number" && config.spoofMasteryRank >= 0) {
        inventoryResponse.PlayerLevel = config.spoofMasteryRank;
        if (!("xpBasedLevelCapDisabled" in request.query)) {
            // This client has not been patched to accept any mastery rank, need to fake the XP.
            inventoryResponse.XPInfo = [];
            let numFrames = getExpRequiredForMr(Math.min(config.spoofMasteryRank, 5030)) / 6000;
            while (numFrames-- > 0) {
                inventoryResponse.XPInfo.push({
                    ItemType: "/Lotus/Powersuits/Mag/Mag",
                    XP: 1_600_000
                });
            }
        }
    }

    // Fix for #380
    inventoryResponse.NextRefill = { $date: { $numberLong: "9999999999999" } };

    response.json(inventoryResponse);
};

/*
const addString = (arr: string[], str: string): void => {
    if (!arr.find(x => x == str)) {
        arr.push(str);
    }
};*/

const getExpRequiredForMr = (rank: number): number => {
    if (rank <= 30) {
        return 2500 * rank * rank;
    }
    return 2_250_000 + 147_500 * (rank - 30);
};

export { inventoryController };
