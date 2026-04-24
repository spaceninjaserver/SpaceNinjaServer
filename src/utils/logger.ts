import type { LeveledLogMethod } from "winston";
import type { Format } from "logform";
import { createLogger, format, transports, addColors } from "winston";
import "winston-daily-rotate-file";
import * as util from "node:util";
import { isEmptyObject } from "../helpers/general.ts";
import { config } from "../services/configService.ts";

const createFormat = (colors: boolean, localTime: boolean): Format =>
    format.combine(
        colors ? format.colorize() : format.uncolorize(),
        localTime ? format.timestamp({ format: "YYYY-MM-DDTHH:mm:ss:SSS" }) : format.timestamp(),
        format.metadata({ fillExcept: ["message", "level", "timestamp", "version"] }),
        format.printf(info =>
            (config.logger.format ?? "%timestamp% [%level%] %message%")
                .replaceAll("%timestamp%", info.timestamp as string)
                .replaceAll("%level%", info.level)
                .replaceAll(
                    "%message%",
                    (info.message as string) +
                        (isEmptyObject(info.metadata)
                            ? ""
                            : " " +
                              util.inspect(info.metadata, {
                                  showHidden: false,
                                  depth: null,
                                  colors
                              }))
                )
        )
    );

const fileLog = new transports.DailyRotateFile({
    filename: `logs/${config.logger.level}.log`,
    format: createFormat(false, false),
    datePattern: "YYYY-MM-DD"
});

const consoleLog = new transports.Console({
    forceConsole: false,
    format: createFormat(true, true)
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

/*logger.debug(`guess what it's called when you put an object after a message:`, {
    thatsRight: "it's called metadata (:"
});
logError(new Error("I'm not feeling so good"), "starting up");*/
