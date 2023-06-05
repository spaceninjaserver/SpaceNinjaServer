import { Schema, model } from "mongoose";
import { IShip } from "../types/shipTypes";
import { Oid } from "../types/commonTypes";

const roomSchema = new Schema(
    {
        Name: String,
        MaxCapacity: Number
    },
    { _id: false }
);

const shipSchema = new Schema({
    Rooms: [roomSchema],
    Features: [String],
    ContentUrlSignature: String
});

shipSchema.set("toJSON", {
    transform(_document, returnedObject) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        returnedObject.ShipId = { $oid: returnedObject._id.toString() } satisfies Oid;
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

const shipDatabaseSchema = new Schema({
    ShipOwnerId: Schema.Types.ObjectId,
    Ship: shipSchema,
    Apartment: apartmentSchema
});

shipDatabaseSchema.set("toJSON", {
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

const Ship = model<IShip>("Ship", shipDatabaseSchema);

export { Ship };
