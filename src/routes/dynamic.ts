import express from "express";
import { aggregateSessionsController } from "../controllers/dynamic/aggregateSessionsController.ts";
import { getGuildAdsController } from "../controllers/dynamic/getGuildAdsController.ts";
import { getProfileViewingDataGetController } from "../controllers/dynamic/getProfileViewingDataController.ts";
import { worldStateController } from "../controllers/dynamic/worldStateController.ts";

const dynamicRouter = express.Router();

dynamicRouter.get("/aggregateSessions.php", aggregateSessionsController);
dynamicRouter.get("/getGuildAds.php", getGuildAdsController);
dynamicRouter.get("/getProfileViewingData.php", getProfileViewingDataGetController);
dynamicRouter.get("/worldState.php", worldStateController);
dynamicRouter.post("/worldState.php", worldStateController); // used by companion app

export { dynamicRouter };
