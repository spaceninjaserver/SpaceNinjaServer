import { IApartment, IRooms, IPlacedDecosDatabase, TBootLocation } from "@/src/types/shipTypes";
import { Model, Types } from "mongoose";

export interface IOrbiter {
    Features: string[];
    Rooms: IRooms[];
    ContentUrlSignature: string;
    BootLocation?: TBootLocation;
}

export interface IPersonalRooms {
    personalRoomsOwnerId: Types.ObjectId;
    activeShipId: Types.ObjectId;
    Ship: IOrbiter;
    Apartment: IApartment;
}

export type RoomsType = { Name: string; MaxCapacity: number; PlacedDecos: Types.DocumentArray<IPlacedDecosDatabase> };

export type PersonalRoomsDocumentProps = {
    Ship: Omit<IOrbiter, "Rooms"> & {
        Rooms: RoomsType[];
    };
    Apartment: Omit<IApartment, "Rooms"> & {
        Rooms: RoomsType[];
    };
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type PersonalRoomsModelType = Model<IPersonalRooms, {}, PersonalRoomsDocumentProps>;
