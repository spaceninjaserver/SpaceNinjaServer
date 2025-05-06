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

app.use((req, _res, next) => {
    // 38.5.0 introduced "ezip" for encrypted body blobs and "e" for request verification only (encrypted body blobs with no application data).
    // The bootstrapper decrypts it for us but having an unsupported Content-Encoding here would still be an issue for Express, so removing it.
    if (req.headers["content-encoding"] == "ezip" || req.headers["content-encoding"] == "e") {
        req.headers["content-encoding"] = undefined;
    }

    // U18 uses application/x-www-form-urlencoded even tho the data is JSON which Express doesn't like.
    // U17 sets no Content-Type at all, which Express also doesn't like.
    if (!req.headers["content-type"] || req.headers["content-type"] == "application/x-www-form-urlencoded") {
        req.headers["content-type"] = "application/octet-stream";
    }

    next();
});

app.use(bodyParser.raw());
app.use(express.json({ limit: "4mb" }));
app.use(bodyParser.text({ limit: "4mb" }));
app.use(requestLogger);

app.use("/api", apiRouter);
app.use("/", cacheRouter);
app.use("/custom", customRouter);
app.use("/dynamic", dynamicController);
app.use("/:id/dynamic", dynamicController);
app.use("/pay", payRouter);
app.use("/stats", statsRouter);
app.use("/", webuiRouter);

app.use(unknownEndpointHandler);
app.use(errorHandler);

export { app };
