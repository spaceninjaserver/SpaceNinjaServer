import { toOid } from "@/src/helpers/inventoryHelpers";
import { colorSchema } from "@/src/models/inventoryModels/inventoryModel";
import { IOrbiter, IPersonalRoomsDatabase, PersonalRoomsModelType } from "@/src/types/personalRoomsTypes";
import {
    IFavouriteLoadoutDatabase,
    IGardening,
    IPlacedDecosDatabase,
    IPictureFrameInfo,
    IRoom,
    ITailorShopDatabase,
    IApartmentDatabase
} from "@/src/types/shipTypes";
import { Schema, model } from "mongoose";

export const pictureFrameInfoSchema = new Schema<IPictureFrameInfo>(
    {
        Image: String,
        Filter: String,
        XOffset: Number,
        YOffset: Number,
        Scale: Number,
        InvertX: Boolean,
        InvertY: Boolean,
        ColorCorrection: Number,
        Text: String,
        TextScale: Number,
        TextColorA: Number,
        TextColorB: Number,
        TextOrientation: Number
    },
    { id: false, _id: false }
);

const placedDecosSchema = new Schema<IPlacedDecosDatabase>(
    {
        Type: String,
        Pos: [Number],
        Rot: [Number],
        Scale: Number,
        PictureFrameInfo: { type: pictureFrameInfoSchema, default: undefined }
    },
    { id: false }
);

placedDecosSchema.virtual("id").get(function (this: IPlacedDecosDatabase) {
    return toOid(this._id);
});

placedDecosSchema.set("toJSON", {
    virtuals: true,
    transform(_document, returnedObject) {
        delete returnedObject._id;
    }
});

const roomSchema = new Schema<IRoom>(
    {
        Name: String,
        MaxCapacity: Number,
        PlacedDecos: { type: [placedDecosSchema], default: [] }
    },
    { _id: false }
);

const favouriteLoadoutSchema = new Schema<IFavouriteLoadoutDatabase>(
    {
        Tag: String,
        LoadoutId: Schema.Types.ObjectId
    },
    { _id: false }
);
favouriteLoadoutSchema.set("toJSON", {
    virtuals: true,
    transform(_document, returnedObject) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        returnedObject.LoadoutId = toOid(returnedObject.LoadoutId);
    }
});

const gardeningSchema = new Schema<IGardening>({
    Planters: [Schema.Types.Mixed] //TODO: add when implementing gardening
});

const apartmentSchema = new Schema<IApartmentDatabase>(
    {
        Rooms: [roomSchema],
        FavouriteLoadouts: [favouriteLoadoutSchema],
        Gardening: gardeningSchema // TODO: ensure this is correct
    },
    { _id: false }
);
const apartmentDefault: IApartmentDatabase = {
    Rooms: [
        { Name: "ElevatorLanding", MaxCapacity: 1600 },
        { Name: "ApartmentRoomA", MaxCapacity: 1000 },
        { Name: "ApartmentRoomB", MaxCapacity: 1600 },
        { Name: "ApartmentRoomC", MaxCapacity: 1600 },
        { Name: "DuviriHallway", MaxCapacity: 1600 }
    ],
    FavouriteLoadouts: [],
    Gardening: {}
};

const orbiterSchema = new Schema<IOrbiter>(
    {
        Features: [String],
        Rooms: [roomSchema],
        VignetteFish: { type: [String], default: undefined },
        FavouriteLoadoutId: Schema.Types.ObjectId,
        Wallpaper: String,
        Vignette: String,
        ContentUrlSignature: { type: String, required: false },
        BootLocation: String
    },
    { _id: false }
);
const orbiterDefault: IOrbiter = {
    Features: ["/Lotus/Types/Items/ShipFeatureItems/EarthNavigationFeatureItem"], //TODO: potentially remove after missionstarting gear
    Rooms: [
        { Name: "AlchemyRoom", MaxCapacity: 1600 },
        { Name: "BridgeRoom", MaxCapacity: 1600 },
        { Name: "LisetRoom", MaxCapacity: 1000 },
        { Name: "OperatorChamberRoom", MaxCapacity: 1600 },
        { Name: "OutsideRoom", MaxCapacity: 1600 },
        { Name: "PersonalQuartersRoom", MaxCapacity: 1600 }
    ]
};

const tailorShopSchema = new Schema<ITailorShopDatabase>(
    {
        FavouriteLoadouts: [favouriteLoadoutSchema],
        Colors: { type: colorSchema, required: false },
        CustomJson: String,
        LevelDecosVisible: Boolean,
        Rooms: [roomSchema]
    },
    { _id: false }
);
const tailorShopDefault: ITailorShopDatabase = {
    FavouriteLoadouts: [],
    CustomJson: "{}",
    LevelDecosVisible: true,
    Rooms: [
        { Name: "LabRoom", MaxCapacity: 4000 },
        { Name: "LivingQuartersRoom", MaxCapacity: 3000 },
        { Name: "HelminthRoom", MaxCapacity: 2000 }
    ]
};

export const personalRoomsSchema = new Schema<IPersonalRoomsDatabase>({
    personalRoomsOwnerId: Schema.Types.ObjectId,
    activeShipId: Schema.Types.ObjectId,
    ShipInteriorColors: colorSchema,
    Ship: { type: orbiterSchema, default: orbiterDefault },
    Apartment: { type: apartmentSchema, default: apartmentDefault },
    TailorShop: { type: tailorShopSchema, default: tailorShopDefault }
});

personalRoomsSchema.index({ personalRoomsOwnerId: 1 }, { unique: true });

export const PersonalRooms = model<IPersonalRoomsDatabase, PersonalRoomsModelType>(
    "PersonalRooms",
    personalRoomsSchema
);
