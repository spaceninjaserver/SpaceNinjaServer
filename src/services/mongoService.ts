import { logger } from "@/src/utils/logger";
import { config } from "@/src/services/configService";
import mongoose from "mongoose";

const url = config.mongodbUrl;

if (url === undefined) {
    throw new Error("MONGODB_URL not found. Make sure you have a .env file in the root of the project!");
}

const connectDatabase = async () => {
    try {
        await mongoose.connect(`${url}`);
        logger.info("connected to MongoDB");
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error(`error connecting to MongoDB ${error.message}`);
        }
    }
};

export { connectDatabase };
