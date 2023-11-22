import { Inventory } from "@/src/models/inventoryModel";
import { RequestHandler } from "express";
import util from "util";
import {
    EquipmentCategories,
    ISaveLoadoutEntry,
    ISaveLoadoutLoadoutEntry,
    ISaveLoadoutRequest
} from "@/src/types/saveLoadoutTypes";
import { isObject } from "@/src/helpers/general";
import { ISuitResponse } from "@/src/types/inventoryTypes/SuitTypes";

export const isObjectEmpty = (obj: Record<string, unknown>) => {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
};

type EquipmentChangeEntry = number | ISaveLoadoutEntry | ISaveLoadoutLoadoutEntry;

export const handleInventoryItemConfigChange = (equipmentChanges: ISaveLoadoutRequest) => {
    for (const [equipmentName, eqp] of Object.entries(equipmentChanges)) {
        const equipment = eqp as EquipmentChangeEntry;
        //console.log(equipmentName);
        if (!isObjectEmpty(equipment)) {
            // non-empty is a change in loadout(or suit...)

            switch (equipmentName) {
                case "LoadOuts": {
                    console.log("loadout received");
                    for (const [loadoutName, loadout] of Object.entries(equipment)) {
                        console.log(loadoutName, loadout);
                        //if (!isObjectEmpty(loadout))
                    }
                    break;
                }
                default:
                    console.log("category not implemented", equipmentName);
            }
            // Object.keys(value).forEach(element => {
            //     console.log("name of inner objects keys", element);
            // });
            // for (const innerValue of Object.values(value)) {
            //     console.log(innerValue);
            // }
        }

        // console.log(innerObjects);
        // if (isObjectEmpty(innerObjects)) {
        //     console.log(innerObjects, "is empty");
        // }
    }
};

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const saveLoadoutController: RequestHandler = async (req, res) => {
    //validate here
    const body: ISaveLoadoutRequest = JSON.parse(req.body as string) as ISaveLoadoutRequest;
    // console.log(util.inspect(body, { showHidden: false, depth: null, colors: true }));

    const { UpgradeVer, ...equipmentChanges } = body;
    handleInventoryItemConfigChange(body);

    res.status(200).end();
};

export { saveLoadoutController };
