import express from "express";

import bodyParser from "body-parser";
import { unknownEndpointHandler } from "@/src/middleware/middleware";
import { requestLogger } from "@/src/middleware/morgenMiddleware";
import { errorHandler } from "@/src/middleware/errorHandler";

import { apiRouter } from "@/src/routes/api";
import { cacheRouter } from "@/src/routes/cache";
import { customRouter } from "@/src/routes/custom";
import { dynamicController } from "@/src/routes/dynamic";
import { payRouter } from "@/src/routes/pay";
import { statsRouter } from "@/src/routes/stats";
import { webuiRouter } from "@/src/routes/webui";

const app = express();

app.use(bodyParser.raw());
app.use(express.json());
app.use(bodyParser.text());
app.use(requestLogger);

app.use("/api", apiRouter);
app.use("/", cacheRouter);
app.use("/custom", customRouter);
app.use("/:id/dynamic", dynamicController);
app.use("/pay", payRouter);
app.use("/stats", statsRouter);
app.use("/", webuiRouter);

app.use(unknownEndpointHandler);
app.use(errorHandler);

export { app };
