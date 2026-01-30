import express from "express";

import bodyParser from "body-parser";
import { unknownEndpointHandler } from "./middleware/middleware.ts";
import { requestLogger } from "./middleware/morgenMiddleware.ts";
import { errorHandler } from "./middleware/errorHandler.ts";

import { apiRouter } from "./routes/api.ts";
import { arbiterRouter } from "./routes/arbiter.ts";
import { cacheRouter } from "./routes/cache.ts";
import { customRouter } from "./routes/custom.ts";
import { dynamicController } from "./routes/dynamic.ts";
import { payRouter } from "./routes/pay.ts";
import { publicExportRouter } from "./routes/publicExport.ts";
import { statsRouter } from "./routes/stats.ts";
import { webuiRouter } from "./routes/webui.ts";

const app = express();

app.use((req, _res, next) => {
    // 38.5.0 introduced "ezip" for encrypted body blobs and "e" for request verification only (encrypted body blobs with no application data).
    // The client patch is expected to decrypt it for us but having an unsupported Content-Encoding here would still be an issue for Express, so removing it.
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
app.use("/api", arbiterRouter);
app.use("/", cacheRouter);
app.use("/custom", customRouter);
app.use("/cdn", dynamicController); // Post-U40
app.use("/dynamic", dynamicController); // Pre-U40
app.use("/:id/dynamic", dynamicController);
app.use("/pay", payRouter);
app.use("/PublicExport/", publicExportRouter);
app.use("/stats", statsRouter);
app.use("/", webuiRouter);
app.use("/.well-known", express.static(".well-known"));

app.use(unknownEndpointHandler);
app.use(errorHandler);

export { app };
