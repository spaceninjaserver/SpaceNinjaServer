import morgan from "morgan";
import { logger } from "../utils/logger.ts";

export const requestLogger = morgan("dev", {
    stream: { write: message => logger.http(message.trim()) }
});
