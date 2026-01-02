import type { RequestHandler } from "express";
import { getTunablesForClient } from "../../services/tunablesService.ts";
import type { AddressInfo } from "node:net";
import { getReflexiveAddress } from "../../services/configService.ts";

// This endpoint is specific to the OpenWF Bootstrapper: https://openwf.io/bootstrapper-manual

export const tunablesController: RequestHandler = (req, res) => {
    res.json(getTunablesForClient((req.socket.address() as AddressInfo).address, getReflexiveAddress(req).myAddress));
};
