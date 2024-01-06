import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";

const rerollRandomModController: RequestHandler = (_req, res) => {
    logger.debug("RerollRandomMod Request", { info: _req.body.toString("hex").replace(/(.)(.)/g, "$1$2 ") });
    res.json({});
};

export { rerollRandomModController };
