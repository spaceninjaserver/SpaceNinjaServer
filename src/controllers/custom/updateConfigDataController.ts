import { RequestHandler } from "express";
import { updateConfig } from "@/src/services/configService";

const updateConfigDataController: RequestHandler = async (req, res) => {
    await updateConfig(req.body.toString());
    res.end();
};

export { updateConfigDataController };
