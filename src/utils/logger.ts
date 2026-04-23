import type { LeveledLogMethod } from "winston";
import { createLogger, format, transports, addColors } from "winston";
import "winston-daily-rotate-file";
import { config } from "../services/configService.ts";

const printf = format.printf(info => {
    return `${info.timestamp as string} [${info.level}] ${info.message as string}`;
});

const fileLog = new transports.DailyRotateFile({
    filename: `logs/${config.logger.level}.log`,
    format: format.combine(
        format.uncolorize(),
        format.timestamp(), // zulu time
        printf
    ),
    datePattern: "YYYY-MM-DD"
});

const consoleLog = new transports.Console({
    forceConsole: false,
    format: format.combine(
        format.colorize(),
        format.timestamp({ format: "YYYY-MM-DDTHH:mm:ss:SSS" }), // uses local timezone
        format.errors({ stack: true }),
        printf
    )
});

const transportOptions = config.logger.files ? [consoleLog, fileLog] : [consoleLog];

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
    level: config.logger.level,
    defaultMeta: { version: process.env.npm_package_version },
    transports: transportOptions
}) as unknown as Record<keyof typeof logLevels.levels, LeveledLogMethod>;

addColors(logLevels.colors);

fileLog.on("new", filename => logger.info(`Using log file: ${filename}`));
fileLog.on("rotate", filename => logger.info(`Rotated log file: ${filename}`));

export const logError = (err: Error, context: string): void => {
    if (err.stack) {
        const stackArr = err.stack.split("\n");
        stackArr[0] += ` while ${context}`;
        logger.error(stackArr.join("\n"));
    } else {
        logger.error(`uncaught error while ${context}: ${err.message}`);
    }
};
