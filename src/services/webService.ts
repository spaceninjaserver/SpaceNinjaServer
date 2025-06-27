import http from "http";
import https from "https";
import fs from "node:fs";
import { config } from "./configService";
import { logger } from "../utils/logger";
import { app } from "../app";
import { AddressInfo } from "node:net";
import ws from "ws";
import { Account } from "../models/loginModel";
import { createAccount, createNonce, getUsernameFromEmail, isCorrectPassword } from "./loginService";
import { IDatabaseAccountJson } from "../types/loginTypes";
import { HydratedDocument } from "mongoose";
import { Agent, WebSocket as UnidiciWebSocket } from "undici";

let httpServer: http.Server | undefined;
let httpsServer: https.Server | undefined;
let wsServer: ws.Server | undefined;
let wssServer: ws.Server | undefined;

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
        wsServer = new ws.Server({ server: httpServer });
        wsServer.on("connection", wsOnConnect);

        logger.info("HTTP server started on port " + httpPort);

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        httpsServer = https.createServer(tlsOptions, app);
        httpsServer.listen(httpsPort, () => {
            wssServer = new ws.Server({ server: httpsServer });
            wssServer.on("connection", wsOnConnect);

            logger.info("HTTPS server started on port " + httpsPort);

            logger.info(
                "Access the WebUI in your browser at http://localhost" + (httpPort == 80 ? "" : ":" + httpPort)
            );

            void runWsSelfTest("wss", httpsPort).then(ok => {
                if (!ok) {
                    logger.warn(`WSS self-test failed. The server may not actually be reachable at port ${httpsPort}.`);
                    if (process.platform == "win32") {
                        logger.warn(
                            `You can check who actually has that port via powershell: Get-Process -Id (Get-NetTCPConnection -LocalPort ${httpsPort}).OwningProcess`
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
    if (wsServer) {
        promises.push(
            new Promise(resolve => {
                wsServer!.close(() => {
                    resolve();
                });
            })
        );
    }
    if (wssServer) {
        promises.push(
            new Promise(resolve => {
                wssServer!.close(() => {
                    resolve();
                });
            })
        );
    }
    await Promise.all(promises);
};

let lastWsid: number = 0;

interface IWsCustomData extends ws {
    id?: number;
    accountId?: string;
}

interface IWsMsgFromClient {
    auth?: {
        email: string;
        password: string;
        isRegister: boolean;
    };
    logout?: boolean;
}

interface IWsMsgToClient {
    //wsid?: number;
    reload?: boolean;
    ports?: {
        http: number | undefined;
        https: number | undefined;
    };
    config_reloaded?: boolean;
    auth_succ?: {
        id: string;
        DisplayName: string;
        Nonce: number;
    };
    auth_fail?: {
        isRegister: boolean;
    };
    logged_out?: boolean;
    update_inventory?: boolean;
}

const wsOnConnect = (ws: ws, req: http.IncomingMessage): void => {
    if (req.url == "/custom/selftest") {
        ws.send("SpaceNinjaServer");
        ws.close();
        return;
    }

    (ws as IWsCustomData).id = ++lastWsid;
    ws.send(JSON.stringify({ wsid: lastWsid }));

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    ws.on("message", async msg => {
        const data = JSON.parse(String(msg)) as IWsMsgFromClient;
        if (data.auth) {
            let account: IDatabaseAccountJson | null = await Account.findOne({ email: data.auth.email });
            if (account) {
                if (isCorrectPassword(data.auth.password, account.password)) {
                    if (!account.Nonce) {
                        account.ClientType = "webui";
                        account.Nonce = createNonce();
                        await (account as HydratedDocument<IDatabaseAccountJson>).save();
                    }
                } else {
                    account = null;
                }
            } else if (data.auth.isRegister) {
                const name = await getUsernameFromEmail(data.auth.email);
                account = await createAccount({
                    email: data.auth.email,
                    password: data.auth.password,
                    ClientType: "webui",
                    LastLogin: new Date(),
                    DisplayName: name,
                    Nonce: createNonce()
                });
            }
            if (account) {
                (ws as IWsCustomData).accountId = account.id;
                ws.send(
                    JSON.stringify({
                        auth_succ: {
                            id: account.id,
                            DisplayName: account.DisplayName,
                            Nonce: account.Nonce
                        }
                    } satisfies IWsMsgToClient)
                );
            } else {
                ws.send(
                    JSON.stringify({
                        auth_fail: {
                            isRegister: data.auth.isRegister
                        }
                    } satisfies IWsMsgToClient)
                );
            }
        }
        if (data.logout) {
            const accountId = (ws as IWsCustomData).accountId;
            (ws as IWsCustomData).accountId = undefined;
            await Account.updateOne(
                {
                    _id: accountId,
                    ClientType: "webui"
                },
                {
                    Nonce: 0
                }
            );
        }
    });
};

export const sendWsBroadcast = (data: IWsMsgToClient): void => {
    const msg = JSON.stringify(data);
    if (wsServer) {
        for (const client of wsServer.clients) {
            client.send(msg);
        }
    }
    if (wssServer) {
        for (const client of wssServer.clients) {
            client.send(msg);
        }
    }
};

export const sendWsBroadcastTo = (accountId: string, data: IWsMsgToClient): void => {
    const msg = JSON.stringify(data);
    if (wsServer) {
        for (const client of wsServer.clients) {
            if ((client as IWsCustomData).accountId == accountId) {
                client.send(msg);
            }
        }
    }
    if (wssServer) {
        for (const client of wssServer.clients) {
            if ((client as IWsCustomData).accountId == accountId) {
                client.send(msg);
            }
        }
    }
};

export const sendWsBroadcastExcept = (wsid: number | undefined, data: IWsMsgToClient): void => {
    const msg = JSON.stringify(data);
    if (wsServer) {
        for (const client of wsServer.clients) {
            if ((client as IWsCustomData).id != wsid) {
                client.send(msg);
            }
        }
    }
    if (wssServer) {
        for (const client of wssServer.clients) {
            if ((client as IWsCustomData).id != wsid) {
                client.send(msg);
            }
        }
    }
};
