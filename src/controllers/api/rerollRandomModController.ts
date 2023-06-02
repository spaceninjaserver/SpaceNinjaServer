import { RequestHandler } from "express";

const rerollRandomModController: RequestHandler = (_req, res) => {
    console.log("RerollRandomMod Request:", _req.body.toString('hex').replace(/(.)(.)/g, '$1$2 '));
    res.json({ });
};

export { rerollRandomModController };