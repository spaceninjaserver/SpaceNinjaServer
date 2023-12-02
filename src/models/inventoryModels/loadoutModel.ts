import { IOid } from "@/src/types/commonTypes";
import { ILoadoutConfigDatabase, ILoadoutDatabase, IEquipmentSelection } from "@/src/types/saveLoadoutTypes";
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
const EquipmentSelectionSchema = new Schema<IEquipmentSelection>(
    {
        ItemId: {
            type: oidSchema,
            default: { $oid: "000000000000000000000000" }
        },
        mod: Number,
        cus: Number
    },
    {
        _id: false
    }
);

const loadoutConfigSchema = new Schema<ILoadoutConfigDatabase>({
    PresetIcon: String,
    Favorite: Boolean,
    s: EquipmentSelectionSchema,
    p: EquipmentSelectionSchema,
    l: EquipmentSelectionSchema,
    m: EquipmentSelectionSchema
});

loadoutConfigSchema.virtual("ItemId").get(function (): string {
    return this._id.toString();
});

loadoutConfigSchema.set("toJSON", {
    virtuals: true,
    transform(_doc, ret, _options) {
        delete ret._id;
        delete ret.__v;
    }
});

const loadoutSchema = new Schema<ILoadoutDatabase, loadoutModelType>({
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
    DRIFTER: [loadoutConfigSchema]
});

loadoutSchema.virtual("ItemId").get(function (): string {
    return this._id.toString();
});

loadoutSchema.set("toJSON", {
    virtuals: true,
    transform(_doc, ret, _options) {
        delete ret._id;
        delete ret.__v;
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

type loadoutModelType = Model<ILoadoutDatabase, {}, loadoutDocumentProps>;

export const LoadoutModel = model<ILoadoutDatabase, loadoutModelType>("Loadout", loadoutSchema);
