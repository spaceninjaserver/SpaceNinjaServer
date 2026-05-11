import type { RequestHandler } from "express";
import { getBuildLabelForUnauthenticatedRequest } from "../../services/loginService.ts";

export const versionController: RequestHandler = (request, res) => {
    const buildLabel: string = getBuildLabelForUnauthenticatedRequest(request);
    res.send(buildLabel);
};
