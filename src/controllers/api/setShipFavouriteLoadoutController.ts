import { getAccountIdForRequest } from "@/src/services/loginService";
import type { RequestHandler } from "express";
import { getPersonalRooms } from "@/src/services/personalRoomsService";
import type { IOid } from "@/src/types/commonTypes";
import { Types } from "mongoose";
import type { IFavouriteLoadoutDatabase, TBootLocation } from "@/src/types/personalRoomsTypes";

export const setShipFavouriteLoadoutController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const personalRooms = await getPersonalRooms(accountId);
    const body = JSON.parse(String(req.body)) as ISetShipFavouriteLoadoutRequest;
    if (body.BootLocation == "LISET") {
        personalRooms.Ship.FavouriteLoadoutId = new Types.ObjectId(body.FavouriteLoadoutId.$oid);
    } else if (body.BootLocation == "APARTMENT") {
        updateTaggedDisplay(personalRooms.Apartment.FavouriteLoadouts, body);
    } else if (body.BootLocation == "SHOP") {
        updateTaggedDisplay(personalRooms.TailorShop.FavouriteLoadouts, body);
    } else {
        console.log(body);
        throw new Error(`unexpected BootLocation: ${body.BootLocation}`);
    }
    await personalRooms.save();
    res.json(body);
};

interface ISetShipFavouriteLoadoutRequest {
    BootLocation: TBootLocation;
    FavouriteLoadoutId: IOid;
    TagName?: string;
}

const updateTaggedDisplay = (arr: IFavouriteLoadoutDatabase[], body: ISetShipFavouriteLoadoutRequest): void => {
    const display = arr.find(x => x.Tag == body.TagName!);
    if (display) {
        display.LoadoutId = new Types.ObjectId(body.FavouriteLoadoutId.$oid);
    } else {
        arr.push({
            Tag: body.TagName!,
            LoadoutId: new Types.ObjectId(body.FavouriteLoadoutId.$oid)
        });
    }
};
