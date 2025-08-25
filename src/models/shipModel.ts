import type { Document, Types } from "mongoose";
import { Schema, model } from "mongoose";
import type { IShipDatabase } from "../types/shipTypes.ts";
import { toOid } from "../helpers/inventoryHelpers.ts";
import { colorSchema } from "./commonModel.ts";
import type { IShipInventory } from "../types/inventoryTypes/inventoryTypes.ts";

const shipSchema = new Schema<IShipDatabase>(
    {
        ItemType: String,
        ShipOwnerId: Schema.Types.ObjectId,
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
    transform(_document, returnedObject: Record<string, any>) {
        const shipResponse = returnedObject as IShipInventory;
        const shipDatabase = returnedObject as IShipDatabase;
        delete returnedObject._id;
        delete returnedObject.__v;
        delete returnedObject.ShipOwnerId;

        shipResponse.ShipExterior = {
            Colors: shipDatabase.ShipExteriorColors,
            ShipAttachments: shipDatabase.ShipAttachments,
            SkinFlavourItem: shipDatabase.SkinFlavourItem
        };
        delete shipDatabase.ShipExteriorColors;
        delete shipDatabase.ShipAttachments;
        delete shipDatabase.SkinFlavourItem;
    }
});

shipSchema.set("toObject", {
    virtuals: true
});

export const Ship = model("Ships", shipSchema);

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type TShipDatabaseDocument = Document<unknown, {}, IShipDatabase> &
    IShipDatabase & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    };
