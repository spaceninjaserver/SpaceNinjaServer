import { createLogger, format, transports, Logger, LeveledLogMethod, addColors } from "winston";
import "winston-daily-rotate-file";
import * as dotenv from "dotenv";
import { inspect } from "util";
import { isEmptyObject } from "@/src/helpers/general";

dotenv.config();

const consolelogFormat = format.printf(({ level, message, version, timestamp }) => {
    return `${timestamp} [${version}] ${level}: ${message}`;
});

const consolelogFormat2 = format.printf(info => {
    if (!isEmptyObject(info.metadata)) {
        return `${info.timestamp} [${info.version}] ${info.level}: ${info.message} ${inspect(info.metadata, {
            showHidden: false,
            depth: null,
            colors: true
        })}`;
    }
    return `${info.timestamp} [${info.version}] ${info.level}: ${info.message}`;
});

const fileFormat = format.combine(format.uncolorize(), format.timestamp(), format.json());

const errorLog = new transports.DailyRotateFile({
    filename: "logs/error.log",
    format: fileFormat,
    level: "error",
    datePattern: "YYYY-MM-DD"
});
const combinedLog = new transports.DailyRotateFile({
    filename: "logs/combined.log",
    format: fileFormat,
    datePattern: "YYYY-MM-DD"
});

const consoleLog = new transports.Console({
    format: format.combine(
        format.colorize(),
        format.timestamp({ format: "YYYY-MM-DDTHH:mm:ss:SSS" }), // uses local timezone
        format.errors({ stack: true }),
        format.align(),
        format.metadata({ fillExcept: ["message", "level", "timestamp", "version"] }),
        consolelogFormat2
    )
});

const transportOptions = process.env.LOG_FILES === "true" ? [consoleLog, errorLog, combinedLog] : [consoleLog];

//possible log levels: { fatal: 0, error: 1, warn: 2, info: 3, http: 4, debug: 5, trace: 6 },
const logLevels = {
    levels: {
        fatal: 0,
        error: 1,
        warn: 2,
        info: 3,
        http: 4,
        debug: 5,
        trace: 6
    },
    colors: {
        fatal: "red",
        error: "red",
        warn: "yellow",
        info: "green",
        http: "green",
        debug: "magenta",
        trace: "cyan"
    }
};

export const logger = createLogger({
    levels: logLevels.levels,
    level: process.env.LOG_LEVEL,
    defaultMeta: { version: process.env.npm_package_version },
    transports: transportOptions
}) as Logger & Record<keyof typeof logLevels.levels, LeveledLogMethod>;

addColors(logLevels.colors);

export function registerLogFileCreationListener() {
    errorLog.on("new", filename => logger.info(`Using error log file: ${filename}`));
    combinedLog.on("new", filename => logger.info(`Using combined log file: ${filename}`));
    errorLog.on("rotate", filename => logger.info(`Rotated error log file: ${filename}`));
    combinedLog.on("rotate", filename => logger.info(`Rotated combined log file: ${filename}`));
}
