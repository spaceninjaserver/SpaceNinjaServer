import express from "express";
import { dojoController, setDojoURLController } from "../controllers/api/dojoController.ts";
import { hubController } from "../controllers/api/hubController.ts";
import { hubInstancesController } from "../controllers/api/hubInstancesController.ts";

const arbiterRouter = express.Router();

arbiterRouter.get("/dojo", dojoController);
arbiterRouter.get("/hub", hubController);
arbiterRouter.get("/hubInstances", hubInstancesController);
arbiterRouter.get("/setDojoURL", setDojoURLController);

export { arbiterRouter };
