import { RequestHandler } from "express";
import { getAccountIdForRequest } from "@/src/services/loginService";
import { getShip } from "@/src/services/shipService";
import { getPersonalRooms } from "@/src/services/personalRoomsService";
import { Types } from "mongoose";
import { Customization } from "@/src/types/shipTypes";

export const setShipCustomizationsController: RequestHandler = async (req, res) => {
    const accountId = await getAccountIdForRequest(req);
    const shipCustomization = JSON.parse(req.body as string) as ISetShipCustomizationsRequest;
    if (shipCustomization.IsExterior) {
        const ship = await getShip(new Types.ObjectId(shipCustomization.ShipId));
        if (ship.ShipOwnerId.toString() == accountId) {
            ship.set({
                ShipExteriorColors: shipCustomization.Customization.Colors,
                SkinFlavourItem: shipCustomization.Customization.SkinFlavourItem,
                ShipAttachments: shipCustomization.Customization.ShipAttachments,
                AirSupportPower: shipCustomization.AirSupportPower!
            });
            await ship.save();
        }
    } else {
        const personalRooms = await getPersonalRooms(accountId);
        personalRooms.ShipInteriorColors = shipCustomization.Customization.Colors;
        await personalRooms.save();
    }
    res.end();
};

interface ISetShipCustomizationsRequest {
    ShipId: string;
    Customization: Customization;
    IsExterior: boolean;
    AirSupportPower?: string;
}
