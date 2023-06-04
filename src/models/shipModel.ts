import { Schema, model } from "mongoose";
import { IShipDatabase } from "../types/shipTypes";
import { Oid } from "../types/commonTypes";

const roomSchema = new Schema({
    Name: String,
    MaxCapacity: Number
});

roomSchema.set("toJSON", {
    transform(_document, returnedObject) {
        delete returnedObject._id;
    }
});

const shipSchema = new Schema({
    Rooms: [roomSchema],
    Features: [Schema.Types.Mixed],
    ContentUrlSignature: String
});

const apartmentSchema = new Schema({
    Rooms: [roomSchema],
    FavouriteLoadouts: [Schema.Types.Mixed]
});

const shipDatabaseSchema = new Schema({
    ShipOwnerId: String,
    Ship: shipSchema,
    Apartment: apartmentSchema
});

shipDatabaseSchema.set("toJSON", {
    transform(_document, returnedObject) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        returnedObject.Ship.ShipId = { $oid: returnedObject._id.toString() } satisfies Oid;
        delete returnedObject._id;
        delete returnedObject.Ship._id;
        delete returnedObject.Apartment._id;
        delete returnedObject.__v;
    }
});

const Ship = model<IShipDatabase>("Ship", shipDatabaseSchema);

export { Ship };
