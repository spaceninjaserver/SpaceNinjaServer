import { aggregateSessionsController } from "@/src/controllers/dynamic/aggregateSessionsController";
import { worldStateController } from "@/src/controllers/dynamic/worldStateController";
import express from "express";

const dynamicController = express.Router();

dynamicController.get("/worldState.php", worldStateController);
dynamicController.get("/aggregateSessions.php", aggregateSessionsController);

export { dynamicController };
