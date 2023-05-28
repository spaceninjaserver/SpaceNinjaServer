import { NextFunction, Request, Response } from "express";

const unknownEndpointHandler = (request: Request, response: Response) => {
    console.error("[ERROR] Unknown Endpoint", request.url);
    response.status(404).json({ error: "endpoint was not found" });
};

const requestLogger = (request: Request, _response: Response, next: NextFunction) => {
    console.log("Method:", request.method);
    console.log("Path:  ", request.path);
    if (Buffer.isBuffer(request.body)) {
        const str = request.body.toString();
        const index = str.lastIndexOf("}");
        const jsonSubstring = str.substring(0, index + 1);
        console.log("Body:  ", jsonSubstring);
        request.body = jsonSubstring;
        if (str.length > jsonSubstring.length) {
            const token = str.substring(index + 1, str.length).trim();
            console.log("Token:  ", token);
        }
    }
    console.log("---");
    next();
};

export { unknownEndpointHandler, requestLogger };
