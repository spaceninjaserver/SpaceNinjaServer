import { RequestHandler } from "express";

const uploadController: RequestHandler = (_req, res) => {
    res.status(200).end();
};

export { uploadController };
