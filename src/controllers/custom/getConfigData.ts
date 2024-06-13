import { RequestHandler } from "express";
import path from "path";
const rootDir = path.join(__dirname, "../../..");

const getConfigData: RequestHandler = (_req, res) => {
    const configFile = require(path.join(rootDir, "config.json"));
    res.json(configFile);
};

export { getConfigData };
