import { RequestHandler } from "express";

export const dojoController: RequestHandler = (_req, res) => {
    res.json("-1"); // Tell client to use authorised request.
};
