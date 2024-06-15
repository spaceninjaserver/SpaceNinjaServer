import { RequestHandler } from "express";
import { config } from "@/src/services/configService";

const getConfigDataController: RequestHandler = (_req, res) => {
    res.json(config);
};

export { getConfigDataController };
