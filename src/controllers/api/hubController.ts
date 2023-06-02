import { RequestHandler } from "express";

const hubController: RequestHandler = (_req, res) => {
    res.json("hub 127.0.0.1:6952");
};

export { hubController };
