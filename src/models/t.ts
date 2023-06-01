import mongoose from "mongoose";

const accountSchema = new mongoose.Schema({
  data: JSON
});

// personSchema.set("toJSON", {
//   transform: (document, returnedObject:) => {
//     returnedObject.id = returnedObject._id.toString();
//     delete returnedObject._id;
//     delete returnedObject.__v;
//   },
// });

const Account = mongoose.model("account", accountSchema);

export { Account };
