import { RequestHandler } from "express";
import getVendorInfoResponse from "@/static/fixed_responses/getVendorInfo.json";

export const getVendorInfoController: RequestHandler = (req, res) => {
    console.assert(req.query.vendor == "/Lotus/Types/Game/VendorManifests/Ostron/MaskSalesmanManifest");
    res.json(getVendorInfoResponse);
};
