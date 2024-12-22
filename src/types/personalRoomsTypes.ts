import { IApartment, IRoom, IPlacedDecosDatabase, ITailorShop, TBootLocation } from "@/src/types/shipTypes";
import { Model, Types } from "mongoose";

export interface IOrbiter {
    Features: string[];
    Rooms: IRoom[];
    ContentUrlSignature: string;
    BootLocation?: TBootLocation;
}

export interface IPersonalRooms {
    personalRoomsOwnerId: Types.ObjectId;
    activeShipId: Types.ObjectId;
    Ship: IOrbiter;
    Apartment: IApartment;
    TailorShop: ITailorShop;
}

export type RoomsType = { Name: string; MaxCapacity: number; PlacedDecos: Types.DocumentArray<IPlacedDecosDatabase> };

export type PersonalRoomsDocumentProps = {
    Ship: Omit<IOrbiter, "Rooms"> & {
        Rooms: RoomsType[];
    };
    Apartment: Omit<IApartment, "Rooms"> & {
        Rooms: RoomsType[];
    };
    TailorShop: Omit<ITailorShop, "Rooms"> & {
        Rooms: RoomsType[];
    };
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type PersonalRoomsModelType = Model<IPersonalRooms, {}, PersonalRoomsDocumentProps>;
