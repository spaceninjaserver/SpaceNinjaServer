import { IDatabaseAccountJson, IIgnore } from "@/src/types/loginTypes";
import { model, Schema, SchemaOptions } from "mongoose";

const opts = {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
} satisfies SchemaOptions;

const databaseAccountSchema = new Schema<IDatabaseAccountJson>(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        DisplayName: { type: String, required: true, unique: true },
        CountryCode: { type: String, required: true },
        ClientType: { type: String },
        CrossPlatformAllowed: { type: Boolean, required: true },
        ForceLogoutVersion: { type: Number, required: true },
        AmazonAuthToken: { type: String },
        AmazonRefreshToken: { type: String },
        ConsentNeeded: { type: Boolean, required: true },
        TrackedSettings: { type: [String], default: [] },
        Nonce: { type: Number, default: 0 },
        BuildLabel: String,
        Dropped: Boolean,
        LatestEventMessageDate: { type: Date, default: 0 },
        LastLoginRewardDate: { type: Number, default: 0 },
        LoginDays: { type: Number, default: 1 }
    },
    opts
);

databaseAccountSchema.set("toJSON", {
    transform(_document, returnedObject) {
        delete returnedObject._id;
        delete returnedObject.__v;
    },
    virtuals: true
});

export const Account = model<IDatabaseAccountJson>("Account", databaseAccountSchema);

const ignoreSchema = new Schema<IIgnore>({
    ignorer: Schema.Types.ObjectId,
    ignoree: Schema.Types.ObjectId
});

ignoreSchema.index({ ignorer: 1 });
ignoreSchema.index({ ignorer: 1, ignoree: 1 }, { unique: true });

export const Ignore = model<IIgnore>("Ignore", ignoreSchema);
