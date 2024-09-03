import { IDatabaseAccountDocument } from "@/src/types/loginTypes";
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

const databaseAccountSchema = new Schema<IDatabaseAccountDocument>(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        DisplayName: { type: String, required: true },
        Nonce: { type: Number, required: true }
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

export const Account = model<IDatabaseAccountDocument>("Account", databaseAccountSchema);
