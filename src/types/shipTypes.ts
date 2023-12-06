import { Types } from "mongoose";
import { IOid } from "@/src/types/commonTypes";

export interface IShip {
    ShipOwnerId: Types.ObjectId;
    Ship: IShipResponse;
    Apartment: IApartment;
    LoadOutInventory: { LoadOutPresets: Types.ObjectId };
}

export interface IShipResponse extends IShipDatabase {
    ShipId: IOid;
}

export interface IShipDatabase {
    Rooms: IRooms[];
    Features: string[];
    ContentUrlSignature: string;
}

// TODO: add Apartment.Gardening
export interface IRooms {
    Name: string;
    MaxCapacity: number;
}

export interface IApartment {
    Rooms: IRooms[];
    FavouriteLoadouts: string[];
}
