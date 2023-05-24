import mongoose, { model, Schema, SchemaOptions } from "mongoose";
import { IDatabaseAccountDocument } from "../types/loginTypes";
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

const databaseAccountSchema = new Schema<IDatabaseAccountDocument>(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        DisplayName: { type: String, required: true },
        CountryCode: { type: String, required: true },
        ClientType: { type: String },
        CrossPlatformAllowed: { type: Boolean, required: true },
        ForceLogoutVersion: { type: Number, required: true },
        AmazonAuthToken: { type: String },
        AmazonRefreshToken: { type: String },
        ConsentNeeded: { type: Boolean, required: true },
        TrackedSettings: { type: [String], default: [] }
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

//databaseAccountSchema.set("");

// Create a virtual property `domain` that's computed from `email`.
// databaseAccountSchema.virtual("id").get(function () {
//   //console.log(this);
//   return this._id;
// });

const Account = model<IDatabaseAccountDocument>("Account", databaseAccountSchema);

export { Account };
