import { getAccountIdForRequest } from "@/src/services/loginService";
import { getJSONfromString } from "@/src/helpers/stringHelpers";
import { startRecipe } from "@/src/services/recipeService";
import { logger } from "@/src/utils/logger";
import { RequestHandler } from "express";

interface IStartRecipeRequest {
    RecipeName: string;
    Ids: string[];
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises
export const startRecipeController: RequestHandler = async (req, res) => {
    const startRecipeRequest = getJSONfromString(String(req.body)) as IStartRecipeRequest;
    logger.debug("StartRecipe Request", { startRecipeRequest });

    const accountId = await getAccountIdForRequest(req);

    const newRecipeId = await startRecipe(startRecipeRequest.RecipeName, accountId);
    res.json(newRecipeId);
};
