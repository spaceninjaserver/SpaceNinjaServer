import { Model, Schema, StringSchemaDefinition, Types, model } from "mongoose";
import { IApartment, IPlacedDecosDatabase, IRooms, IShipDatabase } from "../types/shipTypes";
import { toOid } from "@/src/helpers/inventoryHelpers";
import { colorSchema } from "@/src/models/inventoryModels/inventoryModel";
import { IShipInventory } from "@/src/types/inventoryTypes/inventoryTypes";

const placedDecosSchema = new Schema<IPlacedDecosDatabase>(
    {
        Type: String,
        Pos: [Number],
        Rot: [Number]
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

const shipSchema = new Schema<IShipDatabase>(
    {
        ItemType: String,
        ShipOwnerId: Schema.Types.ObjectId,
        ShipInteriorColors: colorSchema,
        ShipExteriorColors: colorSchema,
        AirSupportPower: String,
        ShipAttachments: { HOOD_ORNAMENT: String },
        SkinFlavourItem: String
    },
    { id: false }
);

shipSchema.virtual("ItemId").get(function () {
    return toOid(this._id);
});

shipSchema.set("toJSON", {
    virtuals: true,
    transform(_document, returnedObject) {
        const shipResponse = returnedObject as IShipInventory;
        const shipDatabase = returnedObject as IShipDatabase;
        delete returnedObject._id;
        delete returnedObject.__v;
        delete returnedObject.ShipOwnerId;
        console.log(shipResponse.ShipExterior);
        if (shipResponse.ShipExterior) {
            shipResponse.ShipExterior = {
                Colors: shipDatabase.ShipExteriorColors,
                ShipAttachments: shipDatabase.ShipAttachments,
                SkinFlavourItem: shipDatabase.SkinFlavourItem
            };
        }
    }
});

shipSchema.set("toObject", {
    virtuals: true
});

const apartmentSchema = new Schema<IApartment>(
    {
        Rooms: [roomSchema],
        FavouriteLoadouts: [Schema.Types.Mixed]
    },
    { _id: false }
);

export const Ship = model("Ships", shipSchema);

export interface IPersonalRooms {
    personalRoomsOwnerId: Types.ObjectId;
    activeShipId: Types.ObjectId;
    Ship: { Features: string[]; Rooms: IRooms[]; ContentUrlSignature: string };
    Apartment: IApartment;
}

const orbiterSchema = new Schema({ Features: [String], Rooms: [roomSchema], ContentUrlSignature: String });

export const personalRoomsSchema = new Schema<IPersonalRooms>({
    personalRoomsOwnerId: Schema.Types.ObjectId,
    activeShipId: Schema.Types.ObjectId,
    Ship: orbiterSchema,
    Apartment: apartmentSchema
});

type RoomsType = { Name: string; MaxCapacity: number; PlacedDecos: Types.DocumentArray<IPlacedDecosDatabase> };
type PersonalRoomsDocumentProps = {
    Ship: {
        Features: string[];
        Rooms: RoomsType[];
    };
};

type PersonalRoomsModelType = Model<IPersonalRooms, {}, PersonalRoomsDocumentProps>;

export const PersonalRooms = model<IPersonalRooms, PersonalRoomsModelType>("PersonalRooms", personalRoomsSchema);
