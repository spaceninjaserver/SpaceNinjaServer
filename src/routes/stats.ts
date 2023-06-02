import express from "express";
import { uploadController } from "../controllers/stats/uploadController";

const statsRouter = express.Router();

statsRouter.post("/upload.php", uploadController); 
export { statsRouter };
