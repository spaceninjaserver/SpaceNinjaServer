import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
    if (err.stack) {
        const stackArr = err.stack.split("\n");
        stackArr[0] += ` while processing ${req.path} request`;
        logger.error(stackArr.join("\n"));
        res.status(500).end();
    } else {
        logger.error(`uncaught error while processing ${req.path} request: ${err.message}`);
        res.status(500).end();
    }
};
