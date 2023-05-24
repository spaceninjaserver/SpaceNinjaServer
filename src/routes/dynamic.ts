import express from "express";
import { aggregateSessionsController } from "../controllers/dynamic/aggregateSessionsController";
import { worldStateController } from "../controllers/dynamic/worldStateController";

const dynamicController = express.Router();

dynamicController.get("/worldState.php", worldStateController);
dynamicController.get("/aggregateSessions.php", aggregateSessionsController);

export { dynamicController };
