import crypto from "node:crypto";
import { args } from "../helpers/commandLineArguments.ts";
import type { ITunables } from "../types/bootstrapperTypes.ts";
import { config } from "./configService.ts";

let secret;
if (args.secret) {
    secret = args.secret; // Maintain same secret across hot reloads in dev mode
} else {
    secret = "";
    for (let i = 0; i != 10; ++i) {
        secret += String.fromCharCode(Math.floor(Math.random() * 26) + 0x41);
    }
}

export const getTokenForClient = (clientAddress: string): string => {
    return crypto.createHmac("sha256", secret).update(clientAddress).digest("hex");
};

export const getTunablesForClient = (clientAddress: string): ITunables => {
    const tunables: ITunables = {};
    if (config.tunables?.useLoginToken) {
        tunables.token = getTokenForClient(clientAddress);
    }
    if (config.tunables?.prohibitSkipMissionStartTimer) {
        tunables.prohibit_skip_mission_start_timer = true;
    }
    if (config.tunables?.prohibitFovOverride) {
        tunables.prohibit_fov_override = true;
    }
    if (config.tunables?.prohibitFreecam) {
        tunables.prohibit_freecam = true;
    }
    if (config.tunables?.prohibitTeleport) {
        tunables.prohibit_teleport = true;
    }
    if (config.tunables?.prohibitScripts) {
        tunables.prohibit_scripts = true;
    }
    if (config.tunables?.motd) {
        tunables.motd = config.tunables.motd;
    }
    if (config.tunables?.udpProxyUpstream) {
        tunables.udp_proxy_upstream = config.tunables.udpProxyUpstream;
    }
    return tunables;
};
