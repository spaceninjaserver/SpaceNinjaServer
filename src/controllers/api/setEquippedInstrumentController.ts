import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getInventory } from "@/src/services/inventoryService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";

export const setEquippedInstrumentController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const inventory = await getInventory(accountId);
    const body = getJSONfromString(String(req.body)) as ISetEquippedInstrumentRequest;
    inventory.EquippedInstrument = body.Instrument;
    await inventory.save();
    res.end();
};

interface ISetEquippedInstrumentRequest {
    Instrument: string;
}
