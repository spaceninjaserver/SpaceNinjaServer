import type http from "http";
import type https from "https";
import type { WebSocket } from "ws";
import { WebSocketServer } from "ws";
import { Account } from "../models/loginModel.ts";
import { createAccount, createNonce, getUsernameFromEmail, isCorrectPassword } from "./loginService.ts";
import type { IDatabaseAccountJson } from "../types/loginTypes.ts";
import type { HydratedDocument } from "mongoose";
import { logError, logger } from "../utils/logger.ts";
import type { Request } from "express";

let wsServer: WebSocketServer | undefined;
let wssServer: WebSocketServer | undefined;

export const startWsServer = (httpServer: http.Server): void => {
    wsServer = new WebSocketServer({ server: httpServer });
    wsServer.on("connection", wsOnConnect);
};

export const startWssServer = (httpsServer: https.Server): void => {
    wssServer = new WebSocketServer({ server: httpsServer });
    wssServer.on("connection", wsOnConnect);
};

export const stopWsServers = (promises: Promise<void>[]): void => {
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
};

let lastWsid: number = 0;

interface IWsCustomData extends WebSocket {
    id: number;
    accountId?: string;
    isGame?: boolean;
}

interface IWsMsgFromClient {
    auth?: {
        email: string;
        password: string;
        isRegister: boolean;
    };
    auth_game?: {
        accountId: string;
        nonce: number;
    };
    logout?: boolean;
    sync_inventory?: boolean;
}

interface IWsMsgToClient {
    // common
    wsid?: number;

    // to webui
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
    nonce_updated?: boolean;
    update_inventory?: boolean;
    logged_out?: boolean;
    have_game_ws?: boolean;

    // to game
    sync_inventory?: boolean;
}

const wsOnConnect = (ws: WebSocket, req: http.IncomingMessage): void => {
    if (req.url == "/custom/selftest") {
        ws.send("SpaceNinjaServer");
        ws.close();
        return;
    }

    (ws as IWsCustomData).id = ++lastWsid;
    ws.send(JSON.stringify({ wsid: lastWsid } satisfies IWsMsgToClient));

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    ws.on("message", async msg => {
        try {
            //console.log(String(msg));
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
                            },
                            have_game_ws: haveGameWs(account.id)
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
            if (data.auth_game) {
                (ws as IWsCustomData).isGame = true;
                if (data.auth_game.nonce) {
                    const account: IDatabaseAccountJson | null = await Account.findOne({
                        _id: data.auth_game.accountId,
                        Nonce: data.auth_game.nonce
                    });
                    if (account) {
                        (ws as IWsCustomData).accountId = account.id;
                        logger.debug(`got bootstrapper connection for ${account.id}`);
                        sendWsBroadcastToWebui({ have_game_ws: true }, account.id);
                    }
                }
            }
            if (data.logout) {
                const accountId = (ws as IWsCustomData).accountId;
                if (accountId) {
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
            }
            if (data.sync_inventory) {
                const accountId = (ws as IWsCustomData).accountId;
                if (accountId) {
                    sendWsBroadcastToGame(accountId, { sync_inventory: true });
                }
            }
        } catch (e) {
            logError(e as Error, `processing websocket message`);
        }
    });
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    ws.on("close", async () => {
        if ((ws as IWsCustomData).isGame && (ws as IWsCustomData).accountId) {
            logger.debug(`lost bootstrapper connection for ${(ws as IWsCustomData).accountId}`);
            sendWsBroadcastToWebui({ have_game_ws: false }, (ws as IWsCustomData).accountId);
            await Account.updateOne(
                {
                    _id: (ws as IWsCustomData).accountId
                },
                {
                    Dropped: true
                }
            );
        }
    });
};

const forEachClient = (cb: (client: IWsCustomData) => void): void => {
    if (wsServer) {
        for (const client of wsServer.clients) {
            cb(client as IWsCustomData);
        }
    }
    if (wssServer) {
        for (const client of wssServer.clients) {
            cb(client as IWsCustomData);
        }
    }
};

export const haveGameWs = (accountId: string): boolean => {
    let ret = false;
    forEachClient(client => {
        if (client.isGame && client.accountId == accountId) {
            ret = true;
        }
    });
    return ret;
};

export const sendWsBroadcast = (data: IWsMsgToClient): void => {
    const msg = JSON.stringify(data);
    forEachClient(client => {
        client.send(msg);
    });
};

export const sendWsBroadcastTo = (accountId: string, data: IWsMsgToClient): void => {
    const msg = JSON.stringify(data);
    forEachClient(client => {
        if (client.accountId == accountId) {
            client.send(msg);
        }
    });
};

export const sendWsBroadcastToGame = (accountId: string, data: IWsMsgToClient): void => {
    const msg = JSON.stringify(data);
    forEachClient(client => {
        if (client.isGame && client.accountId == accountId) {
            client.send(msg);
        }
    });
};

export const sendWsBroadcastEx = (data: IWsMsgToClient, accountId?: string, excludeWsid?: number): void => {
    const msg = JSON.stringify(data);
    forEachClient(client => {
        if ((!accountId || client.accountId == accountId) && client.id != excludeWsid) {
            client.send(msg);
        }
    });
};

export const sendWsBroadcastToWebui = (data: IWsMsgToClient, accountId?: string, excludeWsid?: number): void => {
    const msg = JSON.stringify(data);
    forEachClient(client => {
        if (!client.isGame && (!accountId || client.accountId == accountId) && client.id != excludeWsid) {
            client.send(msg);
        }
    });
};

export const broadcastInventoryUpdate = (req: Request): void => {
    const accountId = req.query.accountId as string;
    if (req.query.wsid) {
        // for webui requests, let other tabs and the game know
        sendWsBroadcastEx(
            { sync_inventory: true, update_inventory: true },
            accountId,
            parseInt(String(req.query.wsid))
        );
    } else {
        // for game requests, let all webui tabs know
        sendWsBroadcastToWebui({ update_inventory: true }, accountId, parseInt(String(req.query.wsid)));
    }
};

export const handleNonceInvalidation = (accountId: string): void => {
    forEachClient(client => {
        if (client.accountId == accountId) {
            if (client.isGame) {
                client.accountId = undefined; // prevent processing of the close event
                client.close();
            } else {
                client.send(JSON.stringify({ nonce_updated: true, have_game_ws: false } satisfies IWsMsgToClient));
            }
        }
    });
};
