/* eslint-disable @typescript-eslint/no-explicit-any */

import { Types } from "mongoose";
import { Oid } from "@/src/types/commonTypes";

export interface IShip {
    ShipOwnerId: Types.ObjectId;
    Ship: IShipClassResponse;
    Apartment: IApartmentClass;
}

export interface IShipClassResponse extends IShipClassDatabase {
    ShipId: Oid;
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
