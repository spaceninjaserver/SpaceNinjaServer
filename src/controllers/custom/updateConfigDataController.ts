import { RequestHandler } from "express";
import { updateConfig } from "@/src/services/configService";

const updateConfigDataController: RequestHandler = async (req, res) => {
    await updateConfig(String(req.body));
    res.end();
};

export { updateConfigDataController };
