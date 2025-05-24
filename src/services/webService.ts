import http from "http";
import https from "https";
import fs from "node:fs";
import { config } from "./configService";
import { logger } from "../utils/logger";
import { app } from "../app";
import { AddressInfo } from "node:net";

let httpServer: http.Server | undefined;
let httpsServer: https.Server | undefined;

const tlsOptions = {
    key: fs.readFileSync("static/certs/key.pem"),
    cert: fs.readFileSync("static/certs/cert.pem")
};

export const startWebServer = (): void => {
    const httpPort = config.httpPort || 80;
    const httpsPort = config.httpsPort || 443;

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    httpServer = http.createServer(app);
    httpServer.listen(httpPort, () => {
        logger.info("HTTP server started on port " + httpPort);
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        httpsServer = https.createServer(tlsOptions, app);
        httpsServer.listen(httpsPort, () => {
            logger.info("HTTPS server started on port " + httpsPort);

            logger.info(
                "Access the WebUI in your browser at http://localhost" + (httpPort == 80 ? "" : ":" + httpPort)
            );
        });
    });
};

export const getWebPorts = (): Record<"http" | "https", number | undefined> => {
    return {
        http: (httpServer?.address() as AddressInfo | undefined)?.port,
        https: (httpsServer?.address() as AddressInfo | undefined)?.port
    };
};

export const stopWebServer = async (): Promise<void> => {
    const promises: Promise<void>[] = [];
    if (httpServer) {
        promises.push(
            new Promise(resolve => {
                httpServer!.close(() => {
                    resolve();
                });
            })
        );
    }
    if (httpsServer) {
        promises.push(
            new Promise(resolve => {
                httpsServer!.close(() => {
                    resolve();
                });
            })
        );
    }
    await Promise.all(promises);
};
