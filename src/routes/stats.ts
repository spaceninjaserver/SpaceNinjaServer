import { uploadController } from "@/src/controllers/stats/uploadController";
import express from "express";

const statsRouter = express.Router();

statsRouter.post("/upload.php", uploadController);
export { statsRouter };
