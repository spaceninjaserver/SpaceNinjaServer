import { RequestHandler } from "express";
import configFile from "@/config.json";

const getConfigData: RequestHandler = (_req, res) => {
    res.json(configFile);
};

export { getConfigData };
