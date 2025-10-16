import type { RequestHandler } from "express";
import type { ITunables } from "../../types/bootstrapperTypes.ts";

// This endpoint is specific to the OpenWF Bootstrapper: https://openwf.io/bootstrapper-manual

export const tunablesController: RequestHandler = (_req, res) => {
    const tunables: ITunables = {};
    //tunables.prohibit_skip_mission_start_timer = true;
    //tunables.prohibit_fov_override = true;
    //tunables.prohibit_freecam = true;
    //tunables.prohibit_teleport = true;
    //tunables.prohibit_scripts = true;
    res.json(tunables);
};
