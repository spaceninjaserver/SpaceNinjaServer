import express from "express";
import { viewController } from "../controllers/stats/viewController.ts";
import { uploadController } from "../controllers/stats/uploadController.ts";
import { leaderboardController } from "../controllers/stats/leaderboardController.ts";

const statsRouter = express.Router();

statsRouter.get("/view.php", viewController);
statsRouter.post("/upload.php", uploadController);
statsRouter.post("/leaderboardWeekly.php", leaderboardController);
statsRouter.post("/leaderboardArchived.php", leaderboardController);

export { statsRouter };
