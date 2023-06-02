import { RequestHandler } from "express";

const updateSessionGetController: RequestHandler = (_req, res) => {
    res.json({});
};
const updateSessionPostController: RequestHandler = (_req, res) => {
    console.log("UpdateSessions POST Request:", JSON.parse(_req.body));

    res.json({ "hasStarted": true });
};
export { updateSessionGetController, updateSessionPostController };
