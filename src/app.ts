import express from "express";
//import { loginRouter } from "./routes/login";

import { requestLogger, unknownEndpointHandler } from "@/src/middleware/middleware";

import { apiRouter } from "@/src/routes/api";
//import { testRouter } from "@/src/routes/test";
import { cacheRouter } from "@/src/routes/cache";
import bodyParser from "body-parser";

import morgan from "morgan";
import { steamPacksController } from "@/src/controllers/misc/steamPacksController";
import { customRouter } from "@/src/routes/custom";
import { dynamicController } from "@/src/routes/dynamic";
import { statsRouter } from "@/src/routes/stats";
import { connectDatabase } from "@/src/services/mongoService";

void connectDatabase();

const app = express();

app.use(bodyParser.raw());
app.use(express.json());
app.use(bodyParser.text());
app.use(morgan("dev"));
//app.use(requestLogger);

app.use("/api", apiRouter);
//app.use("/test", testRouter);
app.use("/", cacheRouter);
app.use("/custom", customRouter);
app.use("/:id/dynamic", dynamicController);

app.post("/pay/steamPacks.php", steamPacksController);
app.use("/stats", statsRouter);

app.use(unknownEndpointHandler);

//app.use(errorHandler)

export { app };
