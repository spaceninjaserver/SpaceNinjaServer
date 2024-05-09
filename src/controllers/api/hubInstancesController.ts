import { RequestHandler } from "express";

const hubInstancesController: RequestHandler = (_req, res) => {
    res.json("list 50 1 0 0 scenarios 0 0 0 0 0 0");
};

export { hubInstancesController };
