import type http from "http";
import type https from "https";
import ws from "ws";
import { Account } from "@/src/models/loginModel";
import { createAccount, createNonce, getUsernameFromEmail, isCorrectPassword } from "@/src/services/loginService";
import type { IDatabaseAccountJson } from "@/src/types/loginTypes";
import type { HydratedDocument } from "mongoose";
import { logError } from "@/src/utils/logger";

let wsServer: ws.Server | undefined;
let wssServer: ws.Server | undefined;

export const startWsServer = (httpServer: http.Server): void => {
    wsServer = new ws.Server({ server: httpServer });
    wsServer.on("connection", wsOnConnect);
};

export const startWssServer = (httpsServer: https.Server): void => {
    wssServer = new ws.Server({ server: httpsServer });
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

interface IWsCustomData extends ws {
    id: number;
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
    nonce_updated?: boolean;
    update_inventory?: boolean;
    logged_out?: boolean;
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
        try {
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
        } catch (e) {
            logError(e as Error, `processing websocket message`);
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

export const sendWsBroadcastEx = (data: IWsMsgToClient, accountId?: string, excludeWsid?: number): void => {
    const msg = JSON.stringify(data);
    if (wsServer) {
        for (const client of wsServer.clients) {
            if (
                (!accountId || (client as IWsCustomData).accountId == accountId) &&
                (client as IWsCustomData).id != excludeWsid
            ) {
                client.send(msg);
            }
        }
    }
    if (wssServer) {
        for (const client of wssServer.clients) {
            if (
                (!accountId || (client as IWsCustomData).accountId == accountId) &&
                (client as IWsCustomData).id != excludeWsid
            ) {
                client.send(msg);
            }
        }
    }
};
