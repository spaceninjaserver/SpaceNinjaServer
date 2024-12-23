import { IDatabaseAccountJson } from "@/src/types/loginTypes";
import { model, Schema, SchemaOptions } from "mongoose";

const opts = {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
} satisfies SchemaOptions;

// {
//   toJSON: { virtuals: true }
// }
// {
//   virtuals: {
//     id: {
//       get() {
//         return "test";
//       }
//     },
//     toJSON: { virtuals: true }
//   }
// }

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
        LastLoginDay: { type: Number }
    },
    opts
);

databaseAccountSchema.set("toJSON", {
    transform(_document, returnedObject) {
        //returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    },
    virtuals: true
});

export const Account = model<IDatabaseAccountJson>("Account", databaseAccountSchema);
