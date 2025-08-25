import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { Inventory } from "@/src/models/inventoryModels/inventoryModel";

export const setEquippedInstrumentController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const body = getJSONfromString<ISetEquippedInstrumentRequest>(String(req.body));

    await Inventory.updateOne(
        {
            accountOwnerId: accountId
        },
        {
            EquippedInstrument: body.Instrument
        }
    );

    res.end();
};

interface ISetEquippedInstrumentRequest {
    Instrument: string;
}
