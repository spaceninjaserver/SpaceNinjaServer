import { fromDbOid, toOid } from "../../helpers/inventoryHelpers.ts";
import type { IOid } from "../../types/commonTypes.ts";
import type { IEquipmentSelectionClient, IEquipmentSelectionDatabase } from "../../types/equipmentTypes.ts";
import type { ILoadoutConfigDatabase, ILoadoutDatabase } from "../../types/saveLoadoutTypes.ts";
import type { Document, Model, Types } from "mongoose";
import { Schema, model } from "mongoose";

//create a mongoose schema based on interface M
export const EquipmentSelectionSchema = new Schema<IEquipmentSelectionDatabase>(
    {
        ItemId: Schema.Types.Mixed, // should be Types.ObjectId but might be IOid because of old commits
        mod: Number,
        cus: Number,
        hide: Boolean
    },
    {
        _id: false
    }
);
EquipmentSelectionSchema.set("toJSON", {
    virtuals: true,
    transform(_doc, ret: Record<string, any>) {
        const db = ret as IEquipmentSelectionDatabase;
        const client = ret as IEquipmentSelectionClient;

        if (db.ItemId) {
            client.ItemId = toOid(fromDbOid(db.ItemId));
        }
    }
});

export const loadoutConfigSchema = new Schema<ILoadoutConfigDatabase>(
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
    transform(_doc, ret: Record<string, any>) {
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
    GEAR: [loadoutConfigSchema],
    KDRIVE: [loadoutConfigSchema],
    DATAKNIFE: [loadoutConfigSchema],
    MECH: [loadoutConfigSchema],
    OPERATOR_ADULT: [loadoutConfigSchema],
    DRIFTER: [loadoutConfigSchema],
    loadoutOwnerId: Schema.Types.ObjectId
});

loadoutSchema.set("toJSON", {
    transform(_doc, ret: Record<string, any>) {
        delete ret._id;
        delete ret.__v;
        delete ret.loadoutOwnerId;
    }
});

loadoutSchema.index({ loadoutOwnerId: 1 }, { unique: true });

//create database typefor ILoadoutConfig
type loadoutDocumentProps = {
    NORMAL: Types.DocumentArray<ILoadoutConfigDatabase>;
    SENTINEL: Types.DocumentArray<ILoadoutConfigDatabase>;
    ARCHWING: Types.DocumentArray<ILoadoutConfigDatabase>;
    NORMAL_PVP: Types.DocumentArray<ILoadoutConfigDatabase>;
    LUNARO: Types.DocumentArray<ILoadoutConfigDatabase>;
    OPERATOR: Types.DocumentArray<ILoadoutConfigDatabase>;
    GEAR: Types.DocumentArray<ILoadoutConfigDatabase>;
    KDRIVE: Types.DocumentArray<ILoadoutConfigDatabase>;
    DATAKNIFE: Types.DocumentArray<ILoadoutConfigDatabase>;
    MECH: Types.DocumentArray<ILoadoutConfigDatabase>;
    OPERATOR_ADULT: Types.DocumentArray<ILoadoutConfigDatabase>;
    DRIFTER: Types.DocumentArray<ILoadoutConfigDatabase>;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type loadoutModelType = Model<ILoadoutDatabase, {}, loadoutDocumentProps>;

export const Loadout = model<ILoadoutDatabase, loadoutModelType>("Loadout", loadoutSchema);

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type TLoadoutDatabaseDocument = Document<unknown, {}, ILoadoutDatabase> &
    Omit<
        ILoadoutDatabase & {
            _id: Types.ObjectId;
        } & {
            __v: number;
        },
        keyof loadoutDocumentProps
    > &
    loadoutDocumentProps;
