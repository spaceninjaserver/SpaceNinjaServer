import express from "express";

import { unknownEndpointHandler } from "@/src/middleware/middleware";
import { requestLogger } from "@/src/middleware/morgenMiddleware";

import { apiRouter } from "@/src/routes/api";
//import { testRouter } from "@/src/routes/test";
import { cacheRouter } from "@/src/routes/cache";
import bodyParser from "body-parser";

import { steamPacksController } from "@/src/controllers/misc/steamPacksController";
import { customRouter } from "@/src/routes/custom";
import { dynamicController } from "@/src/routes/dynamic";
import { statsRouter } from "@/src/routes/stats";
import { webuiRouter } from "@/src/routes/webui";
import { connectDatabase } from "@/src/services/mongoService";
import { registerLogFileCreationListener } from "@/src/utils/logger";
import { worldStateRunner } from "@/src/services/worldStateService";

void registerLogFileCreationListener();
void connectDatabase();
void worldStateRunner();

const app = express();

app.use(bodyParser.raw());
app.use(express.json());
app.use(bodyParser.text());
app.use(requestLogger);
//app.use(requestLogger);

app.use("/api", apiRouter);
//app.use("/test", testRouter);
app.use("/", cacheRouter);
app.use("/custom", customRouter);
app.use("/:id/dynamic", dynamicController);

app.post("/pay/steamPacks.php", steamPacksController);
app.use("/stats", statsRouter);

app.use("/", webuiRouter);

app.use(unknownEndpointHandler);

//app.use(errorHandler)

export { app };
