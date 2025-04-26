import { IColor } from "@/src/types/inventoryTypes/commonInventoryTypes";
import {
    IRoom,
    IPlacedDecosDatabase,
    ITailorShop,
    ITailorShopDatabase,
    TBootLocation,
    IApartmentDatabase,
    IApartmentClient
} from "@/src/types/shipTypes";
import { Document, Model, Types } from "mongoose";

export interface IOrbiter {
    Features: string[];
    Rooms: IRoom[];
    VignetteFish?: string[];
    FavouriteLoadoutId?: Types.ObjectId;
    Wallpaper?: string;
    Vignette?: string;
    ContentUrlSignature?: string;
    BootLocation?: TBootLocation;
}

export interface IPersonalRoomsClient {
    ShipInteriorColors: IColor;
    Ship: IOrbiter;
    Apartment: IApartmentClient;
    TailorShop: ITailorShop;
}

export interface IPersonalRoomsDatabase {
    ShipInteriorColors: IColor;
    personalRoomsOwnerId: Types.ObjectId;
    activeShipId: Types.ObjectId;
    Ship: IOrbiter;
    Apartment: IApartmentDatabase;
    TailorShop: ITailorShopDatabase;
}

export type RoomsType = { Name: string; MaxCapacity: number; PlacedDecos: Types.DocumentArray<IPlacedDecosDatabase> };

export type PersonalRoomsDocumentProps = {
    Ship: Omit<IOrbiter, "Rooms"> & {
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
