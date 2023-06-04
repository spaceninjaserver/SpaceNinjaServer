import http from "http";
import https from "https";
import fs from "node:fs";
import { app } from "./app";

const options = {
    key: fs.readFileSync("static/certs/key.pem"),
    cert: fs.readFileSync("static/certs/cert.pem"),
    passphrase: "123456"
};

http.createServer(app).listen(80, () => console.log("server started on port 80"));
https.createServer(options, app).listen(443, () => console.log("server started on port 443"));
