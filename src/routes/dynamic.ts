import express from "express";
import { aggregateSessionsController } from "../controllers/dynamic/aggregateSessionsController.ts";
import { getGuildAdsController } from "../controllers/dynamic/getGuildAdsController.ts";
import { getProfileViewingDataGetController } from "../controllers/dynamic/getProfileViewingDataController.ts";
import { worldStateController } from "../controllers/dynamic/worldStateController.ts";

const dynamicController = express.Router();

dynamicController.get("/aggregateSessions.php", aggregateSessionsController);
dynamicController.get("/getGuildAds.php", getGuildAdsController);
dynamicController.get("/getProfileViewingData.php", getProfileViewingDataGetController);
dynamicController.get("/worldState.php", worldStateController);

export { dynamicController };
