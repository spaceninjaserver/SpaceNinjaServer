import type { LeveledLogMethod } from "winston";
import type { Format } from "logform";
import { createLogger, format, transports, addColors } from "winston";
import "winston-daily-rotate-file";
import type DailyRotateFile from "winston-daily-rotate-file";
import * as util from "node:util";
import { isEmptyObject } from "../helpers/general.ts";
import { config, type TLogLevel } from "../services/configService.ts";

const createFormat = (colors: boolean, localTime: boolean): Format =>
    format.combine(
        colors ? format.colorize() : format.uncolorize(),
        localTime ? format.timestamp({ format: "YYYY-MM-DDTHH:mm:ss:SSS" }) : format.timestamp(),
        format.metadata({ fillExcept: ["message", "level", "timestamp"] }),
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
                                  depth: Infinity,
                                  colors
                              }))
                )
        )
    );

const logLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        debug: 4,
        trace: 5
    } satisfies Record<TLogLevel, number>,
    colors: {
        error: "red",
        warn: "yellow",
        info: "green",
        http: "green",
        debug: "magenta",
        trace: "cyan"
    } satisfies Record<TLogLevel, string>
};

const realLogger = createLogger({
    levels: logLevels.levels,
    level: "trace"
});
export const logger = realLogger as unknown as Record<TLogLevel, LeveledLogMethod>;

addColors(logLevels.colors);

let fileLog: DailyRotateFile | undefined;
let consoleLog: transports.ConsoleTransportInstance | undefined;

export const initLogger = (): void => {
    if (config.logger.files) {
        fileLog = new transports.DailyRotateFile({
            filename: `logs/${config.logger.fileLevel ?? "trace"}.log`,
            format: createFormat(false, false),
            datePattern: "YYYY-MM-DD",
            level: config.logger.fileLevel ?? "trace"
        });
        realLogger.add(fileLog);
        fileLog.on("new", filename => logger.info(`Using log file: ${filename}`));
        fileLog.on("rotate", filename => logger.info(`Rotated log file: ${filename}`));
    }

    consoleLog = new transports.Console({
        forceConsole: false,
        format: createFormat(true, true),
        level: config.logger.consoleLevel ?? "debug"
    });
    realLogger.add(consoleLog);

    /*logger.debug(`guess what it's called when you put an object after a message:`, {
        thatsRight: "it's called metadata (:"
    });
    logError(new Error("I'm not feeling so good"), "starting up");*/
};

export const deinitLogger = (): void => {
    if (fileLog) {
        realLogger.remove(fileLog);
        fileLog = undefined;
    }

    if (consoleLog) {
        realLogger.remove(consoleLog);
        consoleLog = undefined;
    }
};

export const logError = (err: Error, context: string): void => {
    if (err.stack) {
        const stackArr = err.stack.split("\n");
        stackArr[0] += ` while ${context}`;
        logger.error(stackArr.join("\n"));
    } else {
        logger.error(`uncaught error while ${context}: ${err.message}`);
    }
};
