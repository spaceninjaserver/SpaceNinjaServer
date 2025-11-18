import express from "express";
import { viewController } from "../controllers/stats/viewController.ts";
import { uploadController } from "../controllers/stats/uploadController.ts";
import { leaderboardPostController, leaderboardGetController } from "../controllers/stats/leaderboardController.ts";

const statsRouter = express.Router();

statsRouter.get("/view.php", viewController);
statsRouter.get("/profileStats.php", viewController);
statsRouter.get("/leaderboard.php", leaderboardGetController);
statsRouter.post("/upload.php", uploadController);
statsRouter.post("/view.php", viewController);
statsRouter.post("/leaderboardWeekly.php", leaderboardPostController);
statsRouter.post("/leaderboardArchived.php", leaderboardPostController);

export { statsRouter };
