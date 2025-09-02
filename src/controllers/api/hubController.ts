import type { RequestHandler } from "express";
import { getReflexiveAddress } from "../../services/configService.ts";

export const hubController: RequestHandler = (req, res) => {
    const { myAddress } = getReflexiveAddress(req);
    res.json(`hub ${myAddress}:6952`);
};
