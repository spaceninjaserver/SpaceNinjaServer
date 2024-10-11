import { RequestHandler } from "express";

interface ITunables {
    prohibit_skip_mission_start_timer?: any;
    prohibit_fov_override?: any;
}

const tunablesController: RequestHandler = (_req, res) => {
    const tunablesSet: ITunables = {};
    //tunablesSet.prohibit_skip_mission_start_timer = 1;
    //tunablesSet.prohibit_fov_override = 1;
    res.json(tunablesSet);
};

export { tunablesController };
