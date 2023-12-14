import { viewController } from "../controllers/stats/viewController";
import { uploadController } from "@/src/controllers/stats/uploadController";

import express from "express";

const statsRouter = express.Router();

statsRouter.get("/view.php", viewController);
statsRouter.post("/upload.php", uploadController);

export { statsRouter };
