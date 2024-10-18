import { createLogger, format, transports, Logger, LeveledLogMethod, addColors } from "winston";
import "winston-daily-rotate-file";
import { config } from "@/src/services/configService";
import * as util from "util";
import { isEmptyObject } from "@/src/helpers/general";

// const combineMessageAndSplat = () => {
//     return {
//         transform: (info: any, _opts: any) => {
//             //combine message and args if any
//             info.message = util.format(info.message, ...(info[Symbol.for("splat")] || []));
//             return info;
//         }
//     };
// };

// const alwaysAddMetadata = () => {
//     return {
//         transform(info: any) {
//             if (info[Symbol.for("splat")] === undefined) return info;
//             info.meta = info[Symbol.for("splat")]; //[0].meta;
//             return info;
//         }
//     };
// };

//TODO: in production utils.inspect might be slowing down requests see utils.inspect
const consolelogFormat = format.printf(info => {
    if (!isEmptyObject(info.metadata)) {
        const metadataString = util.inspect(info.metadata, {
            showHidden: false,
            depth: null,
            colors: true
        });

        return `${info.timestamp} [${info.version}] ${info.level}: ${info.message} ${metadataString}`;
    }
    return `${info.timestamp} [${info.version}] ${info.level}: ${info.message}`;
});

const fileFormat = format.combine(
    format.uncolorize(),
    //combineMessageAndSplat(),
    format.timestamp(),
    format.json()
);

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
        //combineMessageAndSplat(),
        //alwaysAddMetadata(),
        format.errors({ stack: true }),
        format.align(),
        format.metadata({ fillExcept: ["message", "level", "timestamp", "version"] }),
        consolelogFormat
    )
});

const transportOptions = config.logger.files ? [consoleLog, errorLog, combinedLog] : [consoleLog];

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
}) as Logger & Record<keyof typeof logLevels.levels, LeveledLogMethod>;

addColors(logLevels.colors);

export function registerLogFileCreationListener(): void {
    errorLog.on("new", filename => logger.info(`Using error log file: ${filename}`));
    combinedLog.on("new", filename => logger.info(`Using combined log file: ${filename}`));
    errorLog.on("rotate", filename => logger.info(`Rotated error log file: ${filename}`));
    combinedLog.on("rotate", filename => logger.info(`Rotated combined log file: ${filename}`));
}
