import express from "express";
import { worldStateController } from "../controllers/dynamic/worldStateController";
import { aggregateSessionsController } from "../controllers/dynamic/aggregateSessionsController";

const dynamicController = express.Router();

dynamicController.get("/worldState.php", worldStateController);
dynamicController.get("/aggregateSessions.php", aggregateSessionsController);

export { dynamicController };
