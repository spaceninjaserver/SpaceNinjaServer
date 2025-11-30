import type { IDatabaseAccountJson, IIgnore } from "../types/loginTypes.ts";
import type { SchemaOptions } from "mongoose";
import { model, Schema } from "mongoose";

const opts = {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
} satisfies SchemaOptions;

export const MAX_NAME_LENGTH = 24;

const databaseAccountSchema = new Schema<IDatabaseAccountJson>(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        DisplayName: { type: String, required: true, unique: true, maxLength: MAX_NAME_LENGTH },
        CountryCode: { type: String, default: "" },
        ClientType: { type: String },
        CrossPlatformAllowed: { type: Boolean, default: true },
        ForceLogoutVersion: { type: Number, default: 0 },
        AmazonAuthToken: { type: String },
        AmazonRefreshToken: { type: String },
        ConsentNeeded: { type: Boolean, default: false },
        TrackedSettings: { type: [String], default: [] },
        Nonce: { type: Number, default: 0 },
        BuildLabel: String,
        Dropped: Boolean,
        LastLogin: { type: Date, default: 0 },
        LatestEventMessageDate: { type: Date, default: 0 },
        LastLoginRewardDate: { type: Number, default: 0 },
        LoginDays: { type: Number, default: 1 },
        DailyFirstWinDate: { type: Number, default: 0 }
    },
    opts
);

databaseAccountSchema.set("toJSON", {
    transform(_document, returnedObject: Record<string, any>) {
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
