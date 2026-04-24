import type { RequestHandler } from "express";
import { config } from "../../services/configService.ts";

export const versionController: RequestHandler = (request, res) => {
    const buildLabel: string =
        typeof request.query.buildLabel == "string"
            ? request.query.buildLabel.replaceAll(" ", "+")
            : (config.fallbackBuildLabel ?? "");

    res.send(buildLabel);
};
