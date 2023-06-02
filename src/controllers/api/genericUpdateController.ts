import { RequestHandler } from "express";

const genericUpdateController: RequestHandler = (_req, res) => {
    console.log("GenericUpdate Request:", JSON.parse(_req.body));
    res.json({});
};

export { genericUpdateController };