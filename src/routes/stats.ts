import express from "express";
import { viewController } from "@/src/controllers/stats/viewController";
import { uploadController } from "@/src/controllers/stats/uploadController";
import { leaderboardController } from "@/src/controllers/stats/leaderboardController";

const statsRouter = express.Router();

statsRouter.get("/view.php", viewController);
statsRouter.post("/upload.php", uploadController);
statsRouter.post("/leaderboardWeekly.php", leaderboardController);
statsRouter.post("/leaderboardArchived.php", leaderboardController);

export { statsRouter };
