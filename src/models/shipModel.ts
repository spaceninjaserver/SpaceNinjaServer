import { IShipDatabase, IShipResponse } from "@/src/types/shipTypes";
import { Schema, model } from "mongoose";

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
    transform(_document, returnedObject: IShipResponse) {
        if (returnedObject._id) {
            returnedObject.Ship.ShipId = { $oid: returnedObject._id.toString() };
        }
        delete returnedObject._id;
        delete returnedObject.Ship._id;
        delete returnedObject.Apartment._id;
        delete returnedObject.__v;
    }
});

const Ship = model<IShipDatabase>("Ship", shipDatabaseSchema);

export { Ship };
