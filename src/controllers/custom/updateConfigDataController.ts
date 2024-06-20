import { RequestHandler } from "express";
import { updateConfig } from "@/src/services/configService";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const updateConfigDataController: RequestHandler = async (req, res) => {
    await updateConfig(req.body.toString());
    res.end();
};

export { updateConfigDataController };
