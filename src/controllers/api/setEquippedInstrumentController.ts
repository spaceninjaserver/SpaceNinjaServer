import type { RequestHandler } from "express";
import { getAccountIdForRequest } from "../../services/loginService.ts";
import { getJSONfromString } from "../../helpers/stringHelpers.ts";
import { Inventory } from "../../models/inventoryModels/inventoryModel.ts";

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
