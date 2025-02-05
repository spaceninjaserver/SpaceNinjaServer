import { RequestHandler } from "express";

// This endpoint is specific to the OpenWF Bootstrapper: https://openwf.io/bootstrapper-manual

interface ITunables {
    prohibit_skip_mission_start_timer?: boolean;
    prohibit_fov_override?: boolean;
    prohibit_freecam?: boolean;
    prohibit_teleport?: boolean;
    prohibit_scripts?: boolean;
}

const tunablesController: RequestHandler = (_req, res) => {
    const tunables: ITunables = {};
    //tunables.prohibit_skip_mission_start_timer = true;
    //tunables.prohibit_fov_override = true;
    //tunables.prohibit_freecam = true;
    //tunables.prohibit_teleport = true;
    //tunables.prohibit_scripts = true;
    res.json(tunables);
};

export { tunablesController };
