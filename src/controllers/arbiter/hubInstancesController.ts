import type { RequestHandler } from "express";

export const hubInstancesController: RequestHandler = (_req, res) => {
    res.json("list 50 1 0 0 scenarios 0 0 0 0 0 0");
};
