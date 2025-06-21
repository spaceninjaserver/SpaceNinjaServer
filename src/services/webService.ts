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

interface IWsCustomData extends ws {
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
}

const wsOnConnect = (ws: ws, _req: http.IncomingMessage): void => {
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
            (ws as IWsCustomData).accountId = undefined;
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
