import { logger } from "@/src/utils/logger";
import { env } from "node:process";
import mongoose from "mongoose";

const { MONGODB_USERNAME, MONGODB_PASSWORD, MONGODB_URL, MONGODB_DATABASE, MONGODB_PORT } = env;

if (MONGODB_USERNAME === undefined) {
    throw new Error("MONGODB_USERNAME not found. Make sure you have a .env file in the root of the project!");
}
if (MONGODB_PASSWORD === undefined) {
    throw new Error("MONGODB_PASSWORD not found. Make sure you have a .env file in the root of the project!");
}
if (MONGODB_URL === undefined) {
    throw new Error("MONGODB_URL not found. Make sure you have a .env file in the root of the project!");
}
if (MONGODB_DATABASE === undefined) {
    throw new Error("MONGODB_DATABASE not found. Make sure you have a .env file in the root of the project!");
}
if (MONGODB_PORT === undefined) {
    throw new Error("MONGOD_PORT not found. Make sure you have a .env file in the root of the project!");
}

const connectDatabase = async () => {
    try {
        await mongoose.connect(
            `mongodb://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@${MONGODB_URL}:${MONGODB_PORT}/${MONGODB_DATABASE}?authSource=admin`
        );
        logger.info("connected to MongoDB");
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error(`error connecting to MongoDB ${error.message}`);
        }
    }
};

export { connectDatabase };
