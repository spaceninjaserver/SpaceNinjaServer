import { RequestHandler } from "express";
import ArchimedeanVendorManifest from "@/static/fixed_responses/getVendorInfo/ArchimedeanVendorManifest.json";
import MaskSalesmanManifest from "@/static/fixed_responses/getVendorInfo/MaskSalesmanManifest.json";
import ZarimanCommisionsManifestArchimedean from "@/static/fixed_responses/getVendorInfo/ZarimanCommisionsManifestArchimedean.json";

export const getVendorInfoController: RequestHandler = (req, res) => {
    switch (req.query.vendor as string) {
        case "/Lotus/Types/Game/VendorManifests/Zariman/ArchimedeanVendorManifest":
            res.json(ArchimedeanVendorManifest);
            break;

        case "/Lotus/Types/Game/VendorManifests/Ostron/MaskSalesmanManifest":
            res.json(MaskSalesmanManifest);
            break;

        case "/Lotus/Types/Game/VendorManifests/Zariman/ZarimanCommisionsManifestArchimedean":
            res.json(ZarimanCommisionsManifestArchimedean);
            break;

        default:
            throw new Error(`Unknown vendor: ${req.query.vendor}`);
    }
};
