import { logger } from "@/src/utils/logger";
import { NextFunction, Request, Response } from "express";

const unknownEndpointHandler = (request: Request, response: Response) => {
    logger.error(`unknown endpoint ${request.method} ${request.path}`);
    response.status(404).json({ error: "endpoint was not found" });
};

// const requestLogger = (request: Request, _response: Response, next: NextFunction) => {
//     console.log("Method:", request.method);
//     console.log("Path:  ", request.path);
//     console.log("Body:  ", request.body);
//     console.log("---");
//     next();
// };

const addCorsHeaders = (_request: Request, response: Response, next: NextFunction) => {
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Headers", "Content-Type");
    next();
};

export { unknownEndpointHandler, addCorsHeaders };
