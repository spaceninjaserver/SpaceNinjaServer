import { toOid } from "@/src/helpers/inventoryHelpers";
import { IOrbiter, IPersonalRooms, PersonalRoomsModelType } from "@/src/types/personalRoomsTypes";
import { IApartment, IGardening, IPlacedDecosDatabase, IPictureFrameInfo } from "@/src/types/shipTypes";
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

const roomSchema = new Schema(
    {
        Name: String,
        MaxCapacity: Number,
        PlacedDecos: [placedDecosSchema]
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

export const personalRoomsSchema = new Schema<IPersonalRooms>({
    personalRoomsOwnerId: Schema.Types.ObjectId,
    activeShipId: Schema.Types.ObjectId,
    Ship: orbiterSchema,
    Apartment: apartmentSchema
});

export const PersonalRooms = model<IPersonalRooms, PersonalRoomsModelType>("PersonalRooms", personalRoomsSchema);
