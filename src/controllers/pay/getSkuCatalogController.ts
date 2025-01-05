import { RequestHandler } from "express";

export const getSkuCatalogController: RequestHandler = (_req, res) => {
    res.sendFile("static/fixed_responses/getSkuCatalog.json", { root: "./" });
};
