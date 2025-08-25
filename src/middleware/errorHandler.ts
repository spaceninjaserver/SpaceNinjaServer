import type { NextFunction, Request, Response } from "express";
import { logError } from "../utils/logger.ts";

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
    if (err.message == "Invalid accountId-nonce pair") {
        res.status(400).send("Log-in expired");
    } else {
        logError(err, `processing ${req.path} request`);
        res.status(500).end();
    }
};
