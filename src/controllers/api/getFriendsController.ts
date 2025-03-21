import { Request, Response } from "express";

// POST with {} instead of GET as of 38.5.0
const getFriendsController = (_request: Request, response: Response): void => {
    response.writeHead(200, {
        //Connection: "keep-alive",
        //"Content-Encoding": "gzip",
        "Content-Type": "text/html",
        // charset: "UTF - 8",
        "Content-Length": "3"
    });
    response.end(Buffer.from([0x7b, 0x7d, 0x0a]));
};

export { getFriendsController };
