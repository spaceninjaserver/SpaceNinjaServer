import express from "express";
import { uploadController } from "../controllers/stats/uploadController";

const statsRouter = express.Router();

//post 
statsRouter.post("/upload.php", uploadController); 
export { statsRouter };
