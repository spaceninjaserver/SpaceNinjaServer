import { RequestHandler } from "express";

const logoutController: RequestHandler = (_req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/html",
        "Content-Length": 1
    });
    res.end("1");
};

export { logoutController };
