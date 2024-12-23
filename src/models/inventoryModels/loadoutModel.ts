import { IOid } from "@/src/types/commonTypes";
import { IEquipmentSelection } from "@/src/types/inventoryTypes/commonInventoryTypes";
import { ILoadoutConfigDatabase, ILoadoutDatabase } from "@/src/types/saveLoadoutTypes";
import { Model, Schema, Types, model } from "mongoose";

const oidSchema = new Schema<IOid>(
    {
        $oid: String
    },
    {
        _id: false
    }
);

//create a mongoose schema based on interface M
export const EquipmentSelectionSchema = new Schema<IEquipmentSelection>(
    {
        ItemId: oidSchema,
        mod: Number,
        cus: Number,
        hide: Boolean
    },
    {
        _id: false
    }
);

const loadoutConfigSchema = new Schema<ILoadoutConfigDatabase>(
    {
        FocusSchool: String,
        PresetIcon: String,
        Favorite: Boolean,
        n: String, // Loadout name
        s: EquipmentSelectionSchema, // Suit
        l: EquipmentSelectionSchema, // Primary weapon
        p: EquipmentSelectionSchema, // Secondary weapon
        m: EquipmentSelectionSchema, // Melee weapon
        h: EquipmentSelectionSchema, // Gravimag weapon
        a: EquipmentSelectionSchema // Necromech exalted weapon
    },
    {
        id: false
    }
);

loadoutConfigSchema.virtual("ItemId").get(function () {
    return { $oid: this._id.toString() } satisfies IOid;
});

loadoutConfigSchema.set("toJSON", {
    virtuals: true,
    transform(_doc, ret, _options) {
        delete ret._id;
        delete ret.__v;
    }
});

export const loadoutSchema = new Schema<ILoadoutDatabase, loadoutModelType>({
    NORMAL: [loadoutConfigSchema],
    SENTINEL: [loadoutConfigSchema],
    ARCHWING: [loadoutConfigSchema],
    NORMAL_PVP: [loadoutConfigSchema],
    LUNARO: [loadoutConfigSchema],
    OPERATOR: [loadoutConfigSchema],
    KDRIVE: [loadoutConfigSchema],
    DATAKNIFE: [loadoutConfigSchema],
    MECH: [loadoutConfigSchema],
    OPERATOR_ADULT: [loadoutConfigSchema],
    DRIFTER: [loadoutConfigSchema],
    loadoutOwnerId: Schema.Types.ObjectId
});

loadoutSchema.set("toJSON", {
    transform(_doc, ret, _options) {
        delete ret._id;
        delete ret.__v;
        delete ret.loadoutOwnerId;
    }
});

//create database typefor ILoadoutConfig
type loadoutDocumentProps = {
    NORMAL: Types.DocumentArray<ILoadoutConfigDatabase>;
    SENTINEL: Types.DocumentArray<ILoadoutConfigDatabase>;
    ARCHWING: Types.DocumentArray<ILoadoutConfigDatabase>;
    NORMAL_PVP: Types.DocumentArray<ILoadoutConfigDatabase>;
    LUNARO: Types.DocumentArray<ILoadoutConfigDatabase>;
    OPERATOR: Types.DocumentArray<ILoadoutConfigDatabase>;
    KDRIVE: Types.DocumentArray<ILoadoutConfigDatabase>;
    DATAKNIFE: Types.DocumentArray<ILoadoutConfigDatabase>;
    MECH: Types.DocumentArray<ILoadoutConfigDatabase>;
    OPERATOR_ADULT: Types.DocumentArray<ILoadoutConfigDatabase>;
    DRIFTER: Types.DocumentArray<ILoadoutConfigDatabase>;
};

// eslint-disable-next-line @typescript-eslint/ban-types
type loadoutModelType = Model<ILoadoutDatabase, {}, loadoutDocumentProps>;

export const Loadout = model<ILoadoutDatabase, loadoutModelType>("Loadout", loadoutSchema);
