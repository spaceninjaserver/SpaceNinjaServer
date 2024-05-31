import { logger } from "./utils/logger";

logger.info("Starting up...");

import http from "http";
import https from "https";
import fs from "node:fs";
import { app } from "./app";
import { config } from "./services/configService";
//const morgan = require("morgan");
//const bodyParser = require("body-parser");

const options = {
    key: fs.readFileSync("static/certs/key.pem"),
    cert: fs.readFileSync("static/certs/cert.pem")
};

const httpPort = config.httpPort || 80;
const httpsPort = config.httpsPort || 443;

// const server = http.createServer(app).listen(80);
http.createServer(app).listen(httpPort, () => logger.info("HTTP server started on port " + httpPort));
const server = https.createServer(options, app);
server.listen(httpsPort, () => logger.info("HTTPS server started on port " + httpsPort));

// server.keepAliveTimeout = 60 * 1000 + 1000;
// server.headersTimeout = 60 * 1000 + 2000;
