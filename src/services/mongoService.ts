import * as dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const url = process.env.MONGODB_URL;

if (!url) throw new Error("MONGODB_URL not found");

console.log("connecting to MongoDB URL:", url);

const connectDatabase = async () => {
    try {
        await mongoose.connect(url);
        console.log("connected to MongoDB");
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("error connecting to MongoDB", error.message);
        }
    }
};

export { connectDatabase };
