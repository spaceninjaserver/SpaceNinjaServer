import { RequestHandler } from "express";
import configFile from "@/config.json";

const getConfigDataController: RequestHandler = (_req, res) => {
    res.json(configFile);
};

export { getConfigDataController };
