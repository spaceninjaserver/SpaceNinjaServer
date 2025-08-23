import { IColor, IShipAttachments, IShipCustomization } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { Document, Model, Types } from "mongoose";
import { ILoadoutClient, ILoadoutConfigClient, ILoadoutConfigDatabase } from "@/src/types/saveLoadoutTypes";
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
    Rooms: IRoomClient[];
    ShipInterior?: IShipCustomization;
    VignetteFish?: string[];
    FavouriteLoadoutId?: IOid;
    Wallpaper?: string;
    Vignette?: string;
    BootLocation?: TBootLocation;
    ContentUrlSignature?: string;
}

export interface IOrbiterDatabase {
    Features: string[];
    Rooms: IRoomDatabase[];
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

export interface IRoomDatabase {
    Name: string;
    MaxCapacity: number;
    PlacedDecos?: IPlacedDecosDatabase[];
}

export interface IRoomClient {
    Name: string;
    MaxCapacity: number;
    PlacedDecos?: IPlacedDecosClient[];
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
    Rooms: IRoomClient[];
    FavouriteLoadouts?: IFavouriteLoadout[];
    VideoWallBackdrop?: string;
    Soundscape?: string;
}

export interface IApartmentDatabase {
    Gardening: IGardeningDatabase;
    Rooms: IRoomDatabase[];
    FavouriteLoadouts: IFavouriteLoadoutDatabase[];
    VideoWallBackdrop?: string;
    Soundscape?: string;
}

export interface IPlacedDecosDatabase {
    Type: string;
    Pos: [number, number, number];
    Rot: [number, number, number];
    Scale?: number;
    Sockets?: number;
    PictureFrameInfo?: IPictureFrameInfo;
    CustomizationInfo?: ICustomizationInfoDatabase;
    AnimPoseItem?: string;
    _id: Types.ObjectId;
}

export interface IPlacedDecosClient extends Omit<IPlacedDecosDatabase, "_id" | "CustomizationInfo"> {
    id: IOid;
    CustomizationInfo?: ICustomizationInfoClient;
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

export interface IResetShipDecorationsRequest {
    Room: string;
    BootLocation?: TBootLocation;
}

export interface IResetShipDecorationsResponse {
    ResetRoom: string;
    ClaimedDecos: [];
    NewCapacity: number;
}

export interface ISetPlacedDecoInfoRequest {
    DecoType?: string;
    DecoId: string;
    Room: string;
    PictureFrameInfo: IPictureFrameInfo; // IsPicture
    CustomizationInfo?: ICustomizationInfoClient; // !IsPicture
    BootLocation?: TBootLocation;
    AnimPoseItem?: string; // !IsPicture
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

export interface ICustomizationInfoClient {
    Anim?: string;
    AnimPose?: number;
    LoadOutPreset?: ILoadoutConfigClient;
    VehiclePreset?: ILoadoutConfigClient;
    EquippedWeapon?: "SUIT_SLOT" | "LONG_GUN_SLOT" | "PISTOL_SLOT";
    AvatarType?: string;
    LoadOutType?: string; // "LOT_NORMAL"
}

export interface ICustomizationInfoDatabase extends Omit<ICustomizationInfoClient, "LoadOutPreset" | "VehiclePreset"> {
    LoadOutPreset?: ILoadoutConfigDatabase;
    VehiclePreset?: ILoadoutConfigDatabase;
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
    Rooms: IRoomDatabase[];
}

export interface ITailorShop extends Omit<ITailorShopDatabase, "Rooms" | "FavouriteLoadouts"> {
    Rooms: IRoomClient[];
    FavouriteLoadouts?: IFavouriteLoadout[];
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
