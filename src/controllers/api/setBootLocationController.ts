import { Request, Response } from "express";

export const setBootLocationController = (req: Request, res: Response) => {
    console.log("setBootLocationController", req.query);
    res.end();
};
