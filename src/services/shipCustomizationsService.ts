import { getPersonalRooms } from "@/src/services/personalRoomsService";
import { getShip } from "@/src/services/shipService";
import {
    ISetShipCustomizationsRequest,
    IShipDatabase,
    IShipDecorationsRequest,
    IShipDecorationsResponse
} from "@/src/types/shipTypes";
import { Types } from "mongoose";

export const setShipCustomizations = async (shipCustomization: ISetShipCustomizationsRequest) => {
    const ship = await getShip(new Types.ObjectId(shipCustomization.ShipId));

    let shipChanges: Partial<IShipDatabase>;
    if (shipCustomization.IsExterior) {
        shipChanges = {
            ShipExteriorColors: shipCustomization.Customization.Colors,
            SkinFlavourItem: shipCustomization.Customization.SkinFlavourItem,
            ShipAttachments: shipCustomization.Customization.ShipAttachments,
            AirSupportPower: shipCustomization.AirSupportPower!
        };
    } else {
        shipChanges = {
            ShipInteriorColors: shipCustomization.Customization.Colors
        };
    }
    ship.set(shipChanges);

    await ship.save();
};

export const handleSetShipDecorations = async (
    accountId: string,
    placedDecoration: IShipDecorationsRequest
): Promise<IShipDecorationsResponse> => {
    const personalRooms = await getPersonalRooms(accountId);

    const rooms = placedDecoration.IsApartment ? personalRooms.Apartment.Rooms : personalRooms.Ship.Rooms;

    const room = rooms.find(room => room.Name === placedDecoration.Room);

    //TODO: check whether to remove from shipitems

    if (placedDecoration.RemoveId) {
        room?.PlacedDecos?.pull({ _id: placedDecoration.RemoveId });
        await personalRooms.save();
        return {
            DecoId: placedDecoration.RemoveId,
            Room: placedDecoration.Room,
            IsApartment: placedDecoration.IsApartment,
            MaxCapacityIncrease: 0
        };
    }

    // TODO: handle capacity

    const decoId = new Types.ObjectId();
    room?.PlacedDecos?.push({
        Type: placedDecoration.Type,
        Pos: placedDecoration.Pos,
        Rot: placedDecoration.Rot,
        _id: decoId
    });

    await personalRooms.save();

    return { DecoId: decoId.toString(), Room: placedDecoration.Room, IsApartment: placedDecoration.IsApartment };
};
