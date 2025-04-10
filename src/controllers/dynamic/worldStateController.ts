import { RequestHandler } from "express";
import { getWorldState } from "@/src/services/worldStateService";

export const worldStateController: RequestHandler = (req, res) => {
    res.json(getWorldState(req.query.buildLabel as string | undefined));
};
