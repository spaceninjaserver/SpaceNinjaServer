import { IColor, IShipAttachments, IShipCustomization } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { Document, Model, Types } from "mongoose";
import { ILoadoutClient } from "@/src/types/saveLoadoutTypes";
import { IMongoDate, IOid } from "@/src/types/commonTypes";

export interface IGetShipResponse {
    ShipOwnerId: string;
    Ship: IOrbiterClient;
    Apartment: IApartmentClient;
    TailorShop: ITailorShop;
    LoadOutInventory: { LoadOutPresets: ILoadoutClient };
}

export type TBootLocation = "LISET" | "DRIFTER_CAMP" | "APARTMENT" | "SHOP";

export interface IOrbiterClient {
    Features: string[];
    ShipId: IOid;
    ShipInterior: IShipCustomization;
    Rooms: IRoom[];
    VignetteFish?: string[];
    FavouriteLoadoutId?: IOid;
    Wallpaper?: string;
    Vignette?: string;
    BootLocation?: TBootLocation;
    ContentUrlSignature?: string;
}

export interface IOrbiterDatabase {
    Features: string[];
    Rooms: IRoom[];
    ShipInterior?: IShipCustomization;
    VignetteFish?: string[];
    FavouriteLoadoutId?: Types.ObjectId;
    Wallpaper?: string;
    Vignette?: string;
    ContentUrlSignature?: string;
    BootLocation?: TBootLocation;
}

export interface IPersonalRoomsClient {
    Ship: IOrbiterClient;
    Apartment: IApartmentClient;
    TailorShop: ITailorShop;
}

export interface IPersonalRoomsDatabase {
    personalRoomsOwnerId: Types.ObjectId;
    activeShipId: Types.ObjectId;

    Ship: IOrbiterDatabase;
    Apartment: IApartmentDatabase;
    TailorShop: ITailorShopDatabase;
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
    Customization: {
        SkinFlavourItem?: string;
        Colors?: IColor;
        ShipAttachments?: IShipAttachments;
        LevelDecosVisible?: boolean;
        CustomJson?: string;
    };
    IsExterior: boolean;
    AirSupportPower?: string;
    IsShop?: boolean;
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
    BootLocation?: TBootLocation;
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
    CustomJson?: string;
    LevelDecosVisible?: boolean;
    Rooms: IRoom[];
}

export interface ITailorShop extends Omit<ITailorShopDatabase, "FavouriteLoadouts"> {
    FavouriteLoadouts: IFavouriteLoadout[];
}

export type RoomsType = { Name: string; MaxCapacity: number; PlacedDecos: Types.DocumentArray<IPlacedDecosDatabase> };

export type PersonalRoomsDocumentProps = {
    Ship: Omit<IOrbiterDatabase, "Rooms"> & {
        Rooms: RoomsType[];
    };
    Apartment: Omit<IApartmentDatabase, "Rooms"> & {
        Rooms: RoomsType[];
    };
    TailorShop: Omit<ITailorShopDatabase, "Rooms"> & {
        Rooms: RoomsType[];
    };
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type PersonalRoomsModelType = Model<IPersonalRoomsDatabase, {}, PersonalRoomsDocumentProps>;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type TPersonalRoomsDatabaseDocument = Document<unknown, {}, IPersonalRoomsDatabase> &
    Omit<
        IPersonalRoomsDatabase & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        },
        keyof PersonalRoomsDocumentProps
    > &
    PersonalRoomsDocumentProps;
