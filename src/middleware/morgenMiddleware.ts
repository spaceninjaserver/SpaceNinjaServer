import morgan from "morgan";
import { logger } from "@/src/utils/logger";

export const requestLogger = morgan("dev", {
    stream: { write: message => logger.http(message) }
});
