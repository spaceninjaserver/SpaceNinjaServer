import type { RequestHandler } from "express";
import {
    accountCheatBooleans,
    accountCheatBooleansHiddenFromWebui,
    accountCheatNumbers,
    type TAccountCheatBooleanKey
} from "../../types/inventoryTypes/inventoryTypes.ts";

interface IWebuiData {
    accountCheats: {
        booleans: TAccountCheatBooleanKey[];
        numbers: typeof accountCheatNumbers;
    };
}

export const getWebuiDataController: RequestHandler = (_req, res) => {
    const data: IWebuiData = {
        accountCheats: {
            booleans: accountCheatBooleans.filter(key => !accountCheatBooleansHiddenFromWebui.includes(key)),
            numbers: accountCheatNumbers
        }
    };
    res.json(data);
};
