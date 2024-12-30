import { getAccountIdForRequest } from "@/src/services/loginService";
import { RequestHandler } from "express";
import { getPersonalRooms } from "@/src/services/personalRoomsService";
import { IOid } from "@/src/types/commonTypes";
import { Types } from "mongoose";

export const setShipFavouriteLoadoutController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const personalRooms = await getPersonalRooms(accountId);
    const body = JSON.parse(String(req.body)) as ISetShipFavouriteLoadoutRequest;
    if (body.BootLocation != "SHOP") {
        throw new Error(`unexpected BootLocation: ${body.BootLocation}`);
    }
    const display = personalRooms.TailorShop.FavouriteLoadouts.find(x => x.Tag == body.TagName);
    if (display) {
        display.LoadoutId = new Types.ObjectId(body.FavouriteLoadoutId.$oid);
    } else {
        personalRooms.TailorShop.FavouriteLoadouts.push({
            Tag: body.TagName,
            LoadoutId: new Types.ObjectId(body.FavouriteLoadoutId.$oid)
        });
    }
    await personalRooms.save();
    res.json({});
};

interface ISetShipFavouriteLoadoutRequest {
    BootLocation: string;
    FavouriteLoadoutId: IOid;
    TagName: string;
}
