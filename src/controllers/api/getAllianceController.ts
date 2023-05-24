import { RequestHandler } from "express-serve-static-core";

const getAllianceController: RequestHandler = (_req, res) => {
    res.sendStatus(200);
};

export { getAllianceController };
