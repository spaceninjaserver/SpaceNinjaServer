import { Types } from "mongoose";
import { IOid } from "@/src/types/commonTypes";

export interface IShip {
    ShipOwnerId: Types.ObjectId;
    Ship: IShipClassResponse;
    Apartment: IApartmentClass;
}

export interface IShipClassResponse extends IShipClassDatabase {
    ShipId: IOid;
}

export interface IShipClassDatabase {
    Rooms: IRoomsClass[];
    Features: string[];
    ContentUrlSignature: string;
}

export interface IRoomsClass {
    Name: string;
    MaxCapacity: number;
}

export interface IApartmentClass {
    Rooms: IRoomsClass[];
    FavouriteLoadouts: string[];
}
