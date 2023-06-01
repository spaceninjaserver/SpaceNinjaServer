import { RequestHandler } from "express";

const dronesController: RequestHandler = (_req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/html",
    "Content-Length": "3"
  });
  res.end(Buffer.from([0x7b, 0x7d, 0x0a]));
};

export { dronesController };
