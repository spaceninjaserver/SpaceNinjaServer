import { NextFunction, Request, Response } from "express";

const unknownEndpointHandler = (request: Request, response: Response) => {
  console.error("[ERROR] Unknown Endpoint", request.url);
  response.status(404).json({ error: "endpoint was not found" });
};

const requestLogger = (request: Request, _response: Response, next: NextFunction) => {
  console.log("Method:", request.method);
  console.log("Path:  ", request.path);
  console.log("Body:  ", request.body);
  console.log("---");
  next();
};

export { unknownEndpointHandler, requestLogger };
