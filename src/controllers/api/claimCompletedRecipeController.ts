//this is a controller for the claimCompletedRecipe route
//it will claim a recipe for the user

import { Request, RequestHandler, Response } from "express";
import { logger } from "@/src/utils/logger";

export const claimCompletedRecipeController: RequestHandler = async (_req: Request, res: Response) => {
    logger.debug("Claiming Completed Recipe");
    res.json({ status: "success" });
};
