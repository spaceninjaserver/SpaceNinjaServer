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
import * as zlib from 'zlib';

void registerLogFileCreationListener();
void connectDatabase();

const app = express();

app.use(function (req, _res, next) {
    var buffer: Buffer[] = []
    req.on('data', function (chunk: Buffer) {
        if (chunk !== undefined && chunk.length > 2 && chunk[0] == 0x1f && chunk[1] == 0x8b) {
            buffer.push(Buffer.from(chunk));
        }
    });

    req.on('end', function () {
        zlib.gunzip(Buffer.concat(buffer), function (_err, dezipped) {
            if (typeof dezipped != 'undefined') {
                req.body = dezipped.toString('utf-8');
            }

            next();
        });
    });
});

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
