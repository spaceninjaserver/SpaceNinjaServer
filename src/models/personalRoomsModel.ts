import { toMongoDate, toOid } from "../helpers/inventoryHelpers.ts";
import type {
    IApartmentDatabase,
    ICustomizationInfoDatabase,
    IFavouriteLoadoutDatabase,
    IGardeningDatabase,
    IOrbiterClient,
    IOrbiterDatabase,
    IPersonalRoomsDatabase,
    IPictureFrameInfo,
    IPlacedDecosDatabase,
    IPlantClient,
    IPlantDatabase,
    IPlanterDatabase,
    IRoomDatabase,
    ITailorShopDatabase,
    PersonalRoomsModelType
} from "../types/personalRoomsTypes.ts";
import type { Types } from "mongoose";
import { Schema, model } from "mongoose";
import { colorSchema, shipCustomizationSchema } from "./commonModel.ts";
import { loadoutConfigSchema } from "./inventoryModels/loadoutModel.ts";

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
    { _id: false }
);

export const customizationInfoSchema = new Schema<ICustomizationInfoDatabase>(
    {
        Anim: String,
        AnimPose: Number,
        LoadOutPreset: loadoutConfigSchema,
        VehiclePreset: loadoutConfigSchema,
        EquippedWeapon: String,
        AvatarType: String,
        LoadOutType: String
    },
    { _id: false }
);

const placedDecosSchema = new Schema<IPlacedDecosDatabase>(
    {
        Type: String,
        Pos: [Number],
        Rot: [Number],
        Scale: Number,
        Sockets: Number,
        PictureFrameInfo: { type: pictureFrameInfoSchema, default: undefined },
        CustomizationInfo: { type: customizationInfoSchema, default: undefined },
        AnimPoseItem: String
    },
    { id: false }
);

placedDecosSchema.virtual("id").get(function (this: IPlacedDecosDatabase) {
    return toOid(this._id);
});

placedDecosSchema.set("toJSON", {
    virtuals: true,
    transform(_document, returnedObject: Record<string, any>) {
        delete returnedObject._id;
    }
});

const roomSchema = new Schema<IRoomDatabase>(
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
    transform(_document, returnedObject: Record<string, any>) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        returnedObject.LoadoutId = toOid(returnedObject.LoadoutId);
    }
});

const plantSchema = new Schema<IPlantDatabase>(
    {
        PlantType: String,
        EndTime: Date,
        PlotIndex: Number
    },
    { _id: false }
);

plantSchema.set("toJSON", {
    virtuals: true,
    transform(_doc, obj: Record<string, any>) {
        const client = obj as IPlantClient;
        const db = obj as IPlantDatabase;

        client.EndTime = toMongoDate(db.EndTime);
    }
});

const planterSchema = new Schema<IPlanterDatabase>(
    {
        Name: { type: String, required: true },
        Plants: { type: [plantSchema], default: [] }
    },
    { _id: false }
);

const gardeningSchema = new Schema<IGardeningDatabase>(
    {
        Planters: { type: [planterSchema], default: [] }
    },
    { _id: false }
);

const apartmentSchema = new Schema<IApartmentDatabase>(
    {
        Rooms: [roomSchema],
        FavouriteLoadouts: [favouriteLoadoutSchema],
        Gardening: gardeningSchema,
        VideoWallBackdrop: String,
        Soundscape: String
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
    Gardening: {
        Planters: []
    }
};

const orbiterSchema = new Schema<IOrbiterDatabase>(
    {
        Features: [String],
        Rooms: [roomSchema],
        ShipInterior: shipCustomizationSchema,
        VignetteFish: { type: [String], default: undefined },
        FavouriteLoadoutId: Schema.Types.ObjectId,
        Wallpaper: String,
        Vignette: String,
        ContentUrlSignature: { type: String, required: false },
        BootLocation: String
    },
    { _id: false }
);
orbiterSchema.set("toJSON", {
    virtuals: true,
    transform(_doc, obj: Record<string, any>) {
        const db = obj as IOrbiterDatabase;
        const client = obj as IOrbiterClient;

        if (db.FavouriteLoadoutId) {
            client.FavouriteLoadoutId = toOid(db.FavouriteLoadoutId);
        }
    }
});
const orbiterDefault: IOrbiterDatabase = {
    Features: ["/Lotus/Types/Items/ShipFeatureItems/EarthNavigationFeatureItem"], //TODO: potentially remove after missionstarting gear
    Rooms: [
        { Name: "AlchemyRoom", MaxCapacity: 1600 },
        {
            Name: "BridgeRoom",
            MaxCapacity: 1600,
            PlacedDecos: [
                {
                    Type: "/Lotus/Objects/Tenno/Props/Ships/LandCraftPlayerProps/ConclaveConsolePlayerShipDeco",
                    Pos: [-30.082, -3.95954, -16.7913],
                    Rot: [-135, 0, 0],
                    _id: undefined as unknown as Types.ObjectId
                }
            ]
        },
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
    Ship: { type: orbiterSchema, default: orbiterDefault },
    Apartment: { type: apartmentSchema, default: apartmentDefault },
    TailorShop: { type: tailorShopSchema, default: tailorShopDefault }
});

personalRoomsSchema.index({ personalRoomsOwnerId: 1 }, { unique: true });

export const PersonalRooms = model<IPersonalRoomsDatabase, PersonalRoomsModelType>(
    "PersonalRooms",
    personalRoomsSchema
);
