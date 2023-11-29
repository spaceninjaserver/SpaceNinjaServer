import { IOid } from "@/src/types/commonTypes";
import { ILoadout, ILoadoutConfig, ILoadoutConfigDocument, ILoadoutDatabase, M } from "@/src/types/saveLoadoutTypes";
import { Model, Schema, Types, model } from "mongoose";

//create a schema for the $oid type
const oidSchema = new Schema<IOid>({
    $oid: String
});

//create a mongoose schema based on interface M
const modSchema = new Schema<M>({
    ItemId: {
        type: oidSchema,
        default: { $oid: "000000000000000000000000" }
    },
    mod: Number,
    cus: Number
});

//default initialization for
const loadoutConfigSchema = new Schema<ILoadoutConfig>(
    {
        PresetIcon: String,
        Favorite: Boolean,
        s: {},
        p: {},
        l: {},
        m: {}
    },
    {
        virtuals: {
            ItemId: {
                get() {
                    return this._id.toString();
                }
            }
        }
    }
);

interface User {
    firstName: string;
    lastName: string;
}

const UserSchema = new Schema(
    {
        firstName: String,
        lastName: String
    },
    {
        virtuals: {
            fullname: {
                get() {
                    return `${this.firstName} ${this.lastName}`;
                }
            }
        }
    }
);

// loadoutConfigSchema.virtual("ItemId").get(function (): string {
//     return this._id
// });

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

//create database typefor ILoadoutConfig
type loadoutDocumentProps = {
    NORMAL: Types.DocumentArray<ILoadoutConfig>;
    SENTINEL: Types.DocumentArray<ILoadoutConfig>;
    ARCHWING: Types.DocumentArray<ILoadoutConfig>;
    NORMAL_PVP: Types.DocumentArray<ILoadoutConfig>;
    LUNARO: Types.DocumentArray<ILoadoutConfig>;
    OPERATOR: Types.DocumentArray<ILoadoutConfig>;
    KDRIVE: Types.DocumentArray<ILoadoutConfig>;
    DATAKNIFE: Types.DocumentArray<ILoadoutConfig>;
    MECH: Types.DocumentArray<ILoadoutConfig>;
    OPERATOR_ADULT: Types.DocumentArray<ILoadoutConfig>;
    DRIFTER: Types.DocumentArray<ILoadoutConfig>;
};

type loadoutModelType = Model<ILoadoutDatabase, {}, loadoutDocumentProps>;

export const LoadoutModel = model<ILoadoutDatabase, loadoutModelType>("Loadout", loadoutSchema);
