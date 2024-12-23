import { Schema, model } from "mongoose";
import { IShipDatabase } from "../types/shipTypes";
import { toOid } from "@/src/helpers/inventoryHelpers";
import { colorSchema } from "@/src/models/inventoryModels/inventoryModel";
import { IShipInventory } from "@/src/types/inventoryTypes/inventoryTypes";

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
    transform(_document, returnedObject) {
        const shipResponse = returnedObject as IShipInventory;
        const shipDatabase = returnedObject as IShipDatabase;
        delete returnedObject._id;
        delete returnedObject.__v;
        delete returnedObject.ShipOwnerId;
        if (shipDatabase.ShipExteriorColors) {
            shipResponse.ShipExterior = {
                Colors: shipDatabase.ShipExteriorColors,
                ShipAttachments: shipDatabase.ShipAttachments,
                SkinFlavourItem: shipDatabase.SkinFlavourItem
            };

            delete shipDatabase.ShipExteriorColors;
            delete shipDatabase.ShipAttachments;
            delete shipDatabase.SkinFlavourItem;
        }
    }
});

shipSchema.set("toObject", {
    virtuals: true
});

export const Ship = model("Ships", shipSchema);
