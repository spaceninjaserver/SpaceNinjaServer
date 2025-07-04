import { Schema } from "mongoose";
import { IColor } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { IShipCustomization } from "@/src/types/personalRoomsTypes";

export const colorSchema = new Schema<IColor>(
    {
        t0: Number,
        t1: Number,
        t2: Number,
        t3: Number,
        en: Number,
        e1: Number,
        m0: Number,
        m1: Number
    },
    { _id: false }
);

export const shipCustomizationSchema = new Schema<IShipCustomization>(
    {
        SkinFlavourItem: String,
        Colors: colorSchema,
        ShipAttachments: { HOOD_ORNAMENT: String }
    },
    { _id: false }
);
