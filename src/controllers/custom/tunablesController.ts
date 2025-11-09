import type { RequestHandler } from "express";
import type { ITunables } from "../../types/bootstrapperTypes.ts";
import { getTunablesForClient } from "../../services/tunablesService.ts";
import type { AddressInfo } from "node:net";

// This endpoint is specific to the OpenWF Bootstrapper: https://openwf.io/bootstrapper-manual

export const tunablesController: RequestHandler = (req, res) => {
    const tunables: ITunables = getTunablesForClient((req.socket.address() as AddressInfo).address);
    res.json(tunables);
};
