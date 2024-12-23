import { toOid } from "@/src/helpers/inventoryHelpers";
import { colorSchema } from "@/src/models/inventoryModels/inventoryModel";
import { IOrbiter, IPersonalRoomsDatabase, PersonalRoomsModelType } from "@/src/types/personalRoomsTypes";
import {
    IApartment,
    IFavouriteLoadoutDatabase,
    IGardening,
    IPlacedDecosDatabase,
    IPictureFrameInfo,
    IRoom,
    ITailorShopDatabase
} from "@/src/types/shipTypes";
import { Schema, model } from "mongoose";

const pictureFrameInfoSchema = new Schema<IPictureFrameInfo>(
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
        PlacedDecos: { type: [placedDecosSchema], default: undefined }
    },
    { _id: false }
);

const gardeningSchema = new Schema<IGardening>({
    Planters: [Schema.Types.Mixed] //TODO: add when implementing gardening
});

const apartmentSchema = new Schema<IApartment>(
    {
        Rooms: [roomSchema],
        FavouriteLoadouts: [Schema.Types.Mixed],
        Gardening: gardeningSchema
    },
    { _id: false }
);

const orbiterSchema = new Schema<IOrbiter>(
    {
        Features: [String],
        Rooms: [roomSchema],
        ContentUrlSignature: String,
        BootLocation: String
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

const tailorShopSchema = new Schema<ITailorShopDatabase>(
    {
        FavouriteLoadouts: [favouriteLoadoutSchema],
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
        {
            Name: "LabRoom",
            MaxCapacity: 4000
        },
        {
            Name: "LivingQuartersRoom",
            MaxCapacity: 3000
        },
        {
            Name: "HelminthRoom",
            MaxCapacity: 2000
        }
    ]
};

export const personalRoomsSchema = new Schema<IPersonalRoomsDatabase>({
    personalRoomsOwnerId: Schema.Types.ObjectId,
    activeShipId: Schema.Types.ObjectId,
    ShipInteriorColors: colorSchema,
    Ship: orbiterSchema,
    Apartment: apartmentSchema,
    TailorShop: { type: tailorShopSchema, default: tailorShopDefault }
});

export const PersonalRooms = model<IPersonalRoomsDatabase, PersonalRoomsModelType>(
    "PersonalRooms",
    personalRoomsSchema
);
