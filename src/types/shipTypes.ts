/* eslint-disable @typescript-eslint/no-explicit-any */

import { Types } from "mongoose";
import { Oid } from "./inventoryTypes";

export type IShipDatabase = IShipResponse;

export interface IShipResponse {
    ShipOwnerId: Types.ObjectId;
    Ship: IShipClass;
    Apartment: IApartmentClass;
}

export interface IShipClass {
    Rooms: IRoomsClass[];
    ShipId: Oid;
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
