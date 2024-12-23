import { logger } from "@/src/utils/logger";
import { config } from "@/src/services/configService";
import mongoose from "mongoose";

const url = config.mongodbUrl;

if (url === undefined) {
    throw new Error("MONGODB_URL not found. Make sure you have a .env file in the root of the project!");
}

export const connectDatabase = async (): Promise<void> => {
    try {
        await mongoose.connect(`${url}`);
        logger.info("Connected to MongoDB");
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error(`Error connecting to MongoDB ${error.message}`);
        }
    }
};
