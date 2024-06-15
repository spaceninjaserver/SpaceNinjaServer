import { Schema, Types } from "mongoose";
import { IOid } from "@/src/types/commonTypes";
import { IColor } from "@/src/types/inventoryTypes/commonInventoryTypes";

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
    Colors?: IColor;
    ShipAttachments?: IShipAttachments;
    SkinFlavourItem?: string;
}

export type TBootLocation = "LISET" | "DRIFTER_CAMP" | "APARTMENT";

export interface IShip {
    Features: string[];
    ShipId: IOid;
    ShipInterior: IShipInterior;
    Rooms: IRooms[];
    ContentUrlSignature: string;
    BootLocation?: TBootLocation;
}

export interface IShipDatabase {
    ItemType: string;
    ShipOwnerId: Schema.Types.ObjectId;
    ShipInteriorColors?: IColor;
    ShipExteriorColors?: IColor;
    AirSupportPower: string;
    ShipAttachments?: IShipAttachments;
    SkinFlavourItem?: string;
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

export interface IGardening {
    Planters: IPlanters[];
}
export interface IApartment {
    Gardening: IGardening;
    Rooms: IRooms[];
    FavouriteLoadouts: string[];
}

export interface IPlacedDecosDatabase {
    Type: string;
    Pos: [number, number, number];
    Rot: [number, number, number];
    Scale: number;
    _id: Types.ObjectId;
}

export interface IPlacedDecosClient extends Omit<IPlacedDecosDatabase, "_id"> {
    id: IOid;
}

export interface ISetShipCustomizationsRequest {
    ShipId: string;
    Customization: Customization;
    IsExterior: boolean;
    AirSupportPower?: string;
}

export interface Customization {
    SkinFlavourItem: string;
    Colors: IColor;
    ShipAttachments: ShipAttachments;
}

//TODO: check for more attachments
export interface ShipAttachments {
    HOOD_ORNAMENT: string;
}

export interface IShipDecorationsRequest {
    Type: string;
    Pos: [number, number, number];
    Rot: [number, number, number];
    Room: string;
    IsApartment: boolean;
    RemoveId?: string;
    MoveId?: string;
    OldRoom?: string;
    Scale?: number;
}

export interface IShipDecorationsResponse {
    DecoId?: string;
    Room?: string;
    IsApartment: boolean;
    MaxCapacityIncrease?: number;
    OldRoom?: string;
    NewRoom?: string;
}
