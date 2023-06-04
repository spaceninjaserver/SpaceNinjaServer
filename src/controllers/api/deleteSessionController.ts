import { RequestHandler } from "express";

const deleteSessionController: RequestHandler = (_req, res) => {
    res.sendStatus(200);
};

export { deleteSessionController };
