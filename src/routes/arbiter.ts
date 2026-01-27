import express from "express";
import { dojoController, setDojoURLController } from "../controllers/arbiter/dojoController.ts";
import { hubController } from "../controllers/arbiter/hubController.ts";
import { hubInstancesController } from "../controllers/arbiter/hubInstancesController.ts";

const arbiterRouter = express.Router();

arbiterRouter.get("/dojo", dojoController);
arbiterRouter.get("/hub", hubController);
arbiterRouter.get("/hubInstances", hubInstancesController);
arbiterRouter.get("/setDojoURL", setDojoURLController);

export { arbiterRouter };
