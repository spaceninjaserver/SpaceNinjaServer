/* eslint-disable @typescript-eslint/no-explicit-any */
import { Oid } from "@/src/types/commonTypes";
import { Types } from "mongoose";

export type IShipDatabase = IShipResponse;

export interface IShipResponse {
    ShipOwnerId: Types.ObjectId;
    Ship: IShipClass;
    Apartment: IApartmentClass;
    _id?: Types.ObjectId;
    __v?: number;
}

export interface IShipClass {
    Rooms: IRoomsClass[];
    ShipId: Oid;
    Features: string[];
    ContentUrlSignature: string;
    _id?: Types.ObjectId;
}

export interface IRoomsClass {
    Name: string;
    MaxCapacity: number;
}

export interface IApartmentClass {
    Rooms: IRoomsClass[];
    FavouriteLoadouts: string[];
    _id?: Types.ObjectId;
}
