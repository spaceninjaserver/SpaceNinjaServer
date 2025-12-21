import type { RequestHandler } from "express";
import { buildConfig } from "../../services/buildConfigService.ts";

export const versionController: RequestHandler = (request, res) => {
    const buildLabel: string =
        typeof request.query.buildLabel == "string"
            ? request.query.buildLabel.split(" ").join("+")
            : buildConfig.buildLabel;

    res.send(buildLabel);
};
