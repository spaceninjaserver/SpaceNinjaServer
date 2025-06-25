import { Types } from "mongoose";
import { IMongoDate, IOid } from "@/src/types/commonTypes";
import { IColor } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { ILoadoutClient } from "./saveLoadoutTypes";

export interface IGetShipResponse {
    ShipOwnerId: string;
    Ship: IShip;
    Apartment: IApartmentClient;
    TailorShop: ITailorShop;
    LoadOutInventory: { LoadOutPresets: ILoadoutClient };
}

export interface IShipAttachments {
    HOOD_ORNAMENT: string;
}

export interface IShipInterior {
    Colors?: IColor;
    ShipAttachments?: IShipAttachments;
    SkinFlavourItem?: string;
}

export type TBootLocation = "LISET" | "DRIFTER_CAMP" | "APARTMENT" | "SHOP";

export interface IShip {
    Features: string[];
    ShipId: IOid;
    ShipInterior: IShipInterior;
    Rooms: IRoom[];
    VignetteFish?: string[];
    FavouriteLoadoutId?: IOid;
    Wallpaper?: string;
    Vignette?: string;
    BootLocation?: TBootLocation;
    ContentUrlSignature?: string;
}

export interface IShipDatabase {
    ItemType: string;
    ShipOwnerId: Types.ObjectId;
    ShipExteriorColors?: IColor;
    AirSupportPower: string;
    ShipAttachments?: IShipAttachments;
    SkinFlavourItem?: string;
}

export interface IRoom {
    Name: string;
    MaxCapacity: number;
    PlacedDecos?: IPlacedDecosDatabase[];
}

export interface IPlantClient {
    PlantType: string;
    EndTime: IMongoDate;
    PlotIndex: number;
}

export interface IPlantDatabase extends Omit<IPlantClient, "EndTime"> {
    EndTime: Date;
}

export interface IPlanterClient {
    Name: string;
    Plants: IPlantClient[];
}

export interface IPlanterDatabase {
    Name: string;
    Plants: IPlantDatabase[];
}

export interface IGardeningClient {
    Planters: IPlanterClient[];
}

export interface IGardeningDatabase {
    Planters: IPlanterDatabase[];
}

export interface IApartmentClient {
    Gardening: IGardeningClient;
    Rooms: IRoom[];
    FavouriteLoadouts: IFavouriteLoadout[];
}

export interface IApartmentDatabase {
    Gardening: IGardeningDatabase;
    Rooms: IRoom[];
    FavouriteLoadouts: IFavouriteLoadoutDatabase[];
}

export interface IPlacedDecosDatabase {
    Type: string;
    Pos: [number, number, number];
    Rot: [number, number, number];
    Scale?: number;
    Sockets?: number;
    PictureFrameInfo?: IPictureFrameInfo;
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
    IsShop?: boolean;
}

export interface Customization {
    SkinFlavourItem: string;
    Colors: IColor;
    ShipAttachments: ShipAttachments;
    LevelDecosVisible: boolean;
    CustomJson: string;
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
    BootLocation?: TBootLocation;
    IsApartment?: boolean;
    RemoveId?: string;
    MoveId?: string;
    OldRoom?: string;
    Scale?: number;
    Sockets?: number;
}

export interface IShipDecorationsResponse {
    DecoId?: string;
    Room?: string;
    IsApartment?: boolean;
    MaxCapacityIncrease?: number;
    OldRoom?: string;
    NewRoom?: string;
}

export interface ISetPlacedDecoInfoRequest {
    DecoType: string;
    DecoId: string;
    Room: string;
    PictureFrameInfo: IPictureFrameInfo;
    BootLocation?: string;
    ComponentId?: string;
    GuildId?: string;
}

export interface IPictureFrameInfo {
    Image: string;
    Filter: string;
    XOffset: number;
    YOffset: number;
    Scale: number;
    InvertX: boolean;
    InvertY: boolean;
    ColorCorrection: number;
    Text: string;
    TextScale: number;
    TextColorA: number;
    TextColorB: number;
    TextOrientation: number;
}

export interface IFavouriteLoadout {
    Tag: string;
    LoadoutId: IOid;
}

export interface IFavouriteLoadoutDatabase {
    Tag: string;
    LoadoutId: Types.ObjectId;
}

export interface ITailorShopDatabase {
    FavouriteLoadouts: IFavouriteLoadoutDatabase[];
    Colors?: IColor;
    CustomJson: string;
    LevelDecosVisible: boolean;
    Rooms: IRoom[];
}

export interface ITailorShop extends Omit<ITailorShopDatabase, "FavouriteLoadouts"> {
    FavouriteLoadouts: IFavouriteLoadout[];
}
