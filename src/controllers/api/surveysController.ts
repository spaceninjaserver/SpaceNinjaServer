import { RequestHandler } from "express";

const surveysController: RequestHandler = (_req, res) => {
    const data = Buffer.from([
        0x7b, 0x22, 0x53, 0x75, 0x72, 0x76, 0x65, 0x79, 0x47, 0x72, 0x6f, 0x75, 0x70, 0x73, 0x22, 0x3a, 0x5b, 0x5d, 0x7d
    ]);
    res.writeHead(200, {
        "Content-Type": "text/html",
        "Content-Length": data.length
    });
    res.end(data);
};

export { surveysController };
