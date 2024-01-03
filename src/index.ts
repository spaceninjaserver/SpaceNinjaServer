import http from "http";
import https from "https";
import fs from "node:fs";
import { app } from "./app";
import { logger } from "./utils/logger";
//const morgan = require("morgan");
//const bodyParser = require("body-parser");

const options = {
    key: fs.readFileSync("static/certs/key.pem"),
    cert: fs.readFileSync("static/certs/cert.pem"),
    passphrase: "123456"
};

// const server = http.createServer(app).listen(80);
http.createServer(app).listen(80, () => logger.info("server started on port 80"));
const server = https.createServer(options, app).listen(443, () => logger.info("server started on port 443"));

// server.keepAliveTimeout = 60 * 1000 + 1000;
// server.headersTimeout = 60 * 1000 + 2000;
