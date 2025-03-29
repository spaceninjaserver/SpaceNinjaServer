import { RequestHandler } from "express";
import { getVendorManifestByTypeName, preprocessVendorManifest } from "@/src/services/serversideVendorsService";

export const getVendorInfoController: RequestHandler = (req, res) => {
    if (typeof req.query.vendor == "string") {
        const manifest = getVendorManifestByTypeName(req.query.vendor);
        if (!manifest) {
            throw new Error(`Unknown vendor: ${req.query.vendor}`);
        }
        res.json(preprocessVendorManifest(manifest));
    } else {
        res.status(400).end();
    }
};
