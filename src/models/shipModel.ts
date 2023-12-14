import { Schema, model } from "mongoose";
import { IShip } from "../types/shipTypes";
import { IOid } from "../types/commonTypes";
import { loadoutSchema } from "@/src/models/inventoryModels/loadoutModel";

const roomSchema = new Schema(
    {
        Name: String,
        MaxCapacity: Number
    },
    { _id: false }
);

const shipSchema = new Schema(
    {
        Rooms: [roomSchema],
        Features: [String],
        ContentUrlSignature: String
    },
    { id: false }
);

shipSchema.virtual("ShipId").get(function () {
    return { $oid: this._id.toString() } satisfies IOid;
});

shipSchema.set("toJSON", {
    virtuals: true,
    transform(_document, returnedObject) {
        delete returnedObject._id;
    }
});

const apartmentSchema = new Schema({
    Rooms: [roomSchema],
    FavouriteLoadouts: [Schema.Types.Mixed]
});

apartmentSchema.set("toJSON", {
    transform(_document, returnedObject) {
        delete returnedObject._id;
    }
});

const shipDatabaseSchema = new Schema<IShip>({
    ShipOwnerId: Schema.Types.ObjectId,
    Ship: shipSchema,
    Apartment: apartmentSchema,
    LoadOutInventory: {
        LoadOutPresets: {
            type: Schema.Types.ObjectId,
            ref: "Loadout"
        }
    }
});

shipDatabaseSchema.set("toJSON", {
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

const Ship = model<IShip>("Ship", shipDatabaseSchema);

export { Ship };
