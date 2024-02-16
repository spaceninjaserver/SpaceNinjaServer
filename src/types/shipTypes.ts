import { Schema, Types } from "mongoose";
import { IOid } from "@/src/types/commonTypes";
import { IColor } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { IShipInventory } from "@/src/types/inventoryTypes/inventoryTypes";
import { colorSchema } from "@/src/models/inventoryModels/inventoryModel";
import { ILoadoutClient } from "@/src/types/saveLoadoutTypes";

export interface IGetShipResponse {
    ShipOwnerId: string;
    Ship: IShip;
    Apartment: IApartment;
    LoadOutInventory: { LoadOutPresets: Types.ObjectId };
}

export interface IShipAttachments {
    HOOD_ORNAMENT: string;
}

export interface IShipInterior {
    Colors: IColor;
    ShipAttachments: IShipAttachments;
    SkinFlavourItem: string;
}

export interface IShip {
    Features: string[];
    ShipId: IOid;
    ShipInterior: IShipInterior;
    Rooms: IRooms[];
    ContentUrlSignature: string;
}

export interface IShipDatabase {
    ItemType: string;
    ShipOwnerId: Schema.Types.ObjectId;
    ShipInteriorColors: IColor;
    ShipExteriorColors: IColor;
    AirSupportPower: string;
    ShipAttachments: IShipAttachments;
    SkinFlavourItem: string;
}

export interface IRooms {
    Name: string;
    MaxCapacity: number;
    PlacedDecos?: IPlacedDecosDatabase[];
}

export interface IPlants {
    PlantType: string;
    EndTime: IOid;
    PlotIndex: number;
}
export interface IPlanters {
    Name: string;
    Plants: IPlants[];
}

export interface IApartment {
    Gardening: { Planters: IPlanters[] };
    Rooms: IRooms[];
    FavouriteLoadouts: string[];
}

export interface IPlacedDecosDatabase {
    Type: string;
    Pos: [number, number, number];
    Rot: [number, number, number];
    _id: Types.ObjectId;
}

export interface IPlacedDecosClient extends Omit<IPlacedDecosDatabase, "_id"> {
    id: IOid;
}
