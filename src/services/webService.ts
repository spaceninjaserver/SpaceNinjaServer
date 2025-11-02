import http from "http";
import https from "https";
import fs from "node:fs";
import { configGetWebBindings, type IBindings } from "./configService.ts";
import { logger } from "../utils/logger.ts";
import { app } from "../app.ts";
import type { AddressInfo } from "node:net";
import { Agent, WebSocket as UnidiciWebSocket } from "undici";
import { startWsServer, startWssServer, stopWsServers } from "./wsService.ts";

let httpServer: http.Server | undefined;
let httpsServer: https.Server | undefined;

const tlsOptions = {
    key: fs.readFileSync("static/cert/key.pem"),
    cert: fs.readFileSync("static/cert/cert.pem")
};

export const startWebServer = (): void => {
    const bindings = configGetWebBindings();

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    httpServer = http.createServer(app);
    httpServer.listen(bindings.httpPort, bindings.address, () => {
        startWsServer(httpServer!);

        logger.info(`HTTP server started on ${bindings.address}:${bindings.httpPort}`);

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        httpsServer = https.createServer(tlsOptions, app);
        httpsServer.listen(bindings.httpsPort, bindings.address, () => {
            startWssServer(httpsServer!);

            logger.info(`HTTPS server started on ${bindings.address}:${bindings.httpsPort}`);

            logger.info(
                "Access the WebUI in your browser at http://localhost" +
                    (bindings.httpPort == 80 ? "" : ":" + bindings.httpPort)
            );

            void runWsSelfTest("wss", bindings.httpsPort).then(ok => {
                if (!ok) {
                    logger.warn(
                        `WSS self-test failed. The server may not be reachable locally on port ${bindings.httpsPort}.`
                    );
                    if (process.platform == "win32") {
                        logger.warn(
                            `You can check who has that port via powershell: Get-Process -Id (Get-NetTCPConnection -LocalPort ${bindings.httpsPort}).OwningProcess`
                        );
                    }
                }
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

export const getWebBindings = (): Partial<IBindings> => {
    return {
        address: (httpServer?.address() as AddressInfo | undefined)?.address,
        httpPort: (httpServer?.address() as AddressInfo | undefined)?.port,
        httpsPort: (httpsServer?.address() as AddressInfo | undefined)?.port
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
    stopWsServers(promises);
    await Promise.all(promises);
};
