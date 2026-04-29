import http from "http";
import https from "https";
import fs from "node:fs";
import { getWebServerParams } from "./configService.ts";
import { logger } from "../utils/logger.ts";
import { app } from "../app.ts";
import { Agent, WebSocket as UnidiciWebSocket } from "undici";
import { startWsServer, startWssServer, stopWsServers } from "./wsService.ts";

let httpServer: http.Server | undefined;
let httpsServer: https.Server | undefined;

export interface IListenError extends Error {
    code: string;
    port?: number;
}

export const startWebServer = (): Promise<void> => {
    const params = getWebServerParams();

    const tlsOptions = {
        cert: fs.readFileSync(params.certFile),
        key: fs.readFileSync(params.keyFile)
    };

    return new Promise<void>((resolve, reject) => {
        httpServer = http.createServer(app);
        httpServer.on("error", (err: IListenError) => {
            if (err.code == "EADDRINUSE") {
                err.port = params.httpPort;
            }
            reject(err);
        });
        httpServer.listen(params.httpPort, params.address, () => {
            httpsServer = https.createServer(tlsOptions, app);
            httpsServer.on("error", (err: IListenError) => {
                if (err.code == "EADDRINUSE") {
                    err.port = params.httpsPort;
                }
                httpServer!.close();
                reject(err);
            });
            httpsServer.listen(params.httpsPort, params.address, () => {
                startWsServer(httpServer!);
                startWssServer(httpsServer!);

                logger.info(`HTTP server started on ${params.address}:${params.httpPort}`);
                logger.info(`HTTPS server started on ${params.address}:${params.httpsPort}`);
                logger.info(
                    "Access the WebUI in your browser at http://localhost" +
                        (params.httpPort == 80 ? "" : ":" + params.httpPort)
                );

                resolve();

                void runWsSelfTest("wss", params.httpsPort).then(ok => {
                    if (!ok) {
                        logger.warn(
                            `WSS self-test failed. The server may not be reachable locally on port ${params.httpsPort}.`
                        );
                        if (process.platform == "win32") {
                            logger.warn(
                                `You can check who has that port via powershell: Get-Process -Id (Get-NetTCPConnection -LocalPort ${params.httpsPort}).OwningProcess`
                            );
                        }
                    }
                });
            });
        });
    });
};

const runWsSelfTest = (protocol: "ws" | "wss", port: number): Promise<boolean> => {
    return new Promise(resolve => {
        // https://github.com/oven-sh/bun/issues/20547
        if (process.versions.bun) {
            const client = new WebSocket(`${protocol}://localhost:${port}/custom/selftest`, {
                tls: { rejectUnauthorized: false }
            } as unknown as string);
            client.onmessage = (e): void => {
                resolve(e.data == "SpaceNinjaServer");
            };
            client.onerror = client.onclose = (): void => {
                resolve(false);
            };
        } else {
            const agent = new Agent({ connect: { rejectUnauthorized: false } });
            const client = new UnidiciWebSocket(`${protocol}://localhost:${port}/custom/selftest`, {
                dispatcher: agent
            });
            client.onmessage = (e): void => {
                resolve(e.data == "SpaceNinjaServer");
            };
            client.onerror = client.onclose = (): void => {
                resolve(false);
            };
        }
    });
};

export const stopWebServer = async (): Promise<void> => {
    const promises: Promise<void>[] = [];
    if (httpServer) {
        promises.push(
            new Promise(resolve => {
                httpServer!.close(() => {
                    resolve();
                });
                httpServer!.emit("close");
            })
        );
    }
    if (httpsServer) {
        promises.push(
            new Promise(resolve => {
                httpsServer!.close(() => {
                    resolve();
                });
                httpsServer!.emit("close");
            })
        );
    }
    stopWsServers(promises);
    await Promise.all(promises);
};
