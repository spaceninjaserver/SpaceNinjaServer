import { RequestHandler } from "express";

const logoutController: RequestHandler = (_req, res) => {
    const data = Buffer.from([0x31]);
    res.writeHead(200, {
        "Content-Type": "text/html",
        "Content-Length": data.length
    });
    res.end(data);
};

export { logoutController };
