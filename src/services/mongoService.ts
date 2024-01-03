import { logger } from "@/src/utils/logger";
import * as dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const url = process.env.MONGODB_URL;

if (url === undefined) {
    throw new Error("MONGODB_URL not found. Make sure you have a .env file in the root of the project!");
}

const connectDatabase = async () => {
    try {
        await mongoose.connect(url);
        logger.info("connected to MongoDB");
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error("error connecting to MongoDB", error.message);
        }
    }
};

export { connectDatabase };
