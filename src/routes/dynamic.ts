import express from "express";
import { aggregateSessionsController } from "@/src/controllers/dynamic/aggregateSessionsController";
import { getGuildAdsController } from "@/src/controllers/dynamic/getGuildAdsController";
import { getProfileViewingDataGetController } from "@/src/controllers/dynamic/getProfileViewingDataController";
import { worldStateController } from "@/src/controllers/dynamic/worldStateController";

const dynamicController = express.Router();

dynamicController.get("/aggregateSessions.php", aggregateSessionsController);
dynamicController.get("/getGuildAds.php", getGuildAdsController);
dynamicController.get("/getProfileViewingData.php", getProfileViewingDataGetController);
dynamicController.get("/worldState.php", worldStateController);

export { dynamicController };
