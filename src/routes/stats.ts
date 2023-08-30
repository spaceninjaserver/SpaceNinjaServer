import { viewController } from "../controllers/api/viewController";
import { uploadController } from "@/src/controllers/stats/uploadController";

import express from "express";

const statsRouter = express.Router();

// get
statsRouter.get("/view.php", viewController);

// post
statsRouter.post("/upload.php", uploadController);

export { statsRouter };
