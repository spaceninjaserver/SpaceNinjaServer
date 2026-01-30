import type { RequestHandler } from "express";
import { config, getReflexiveAddress, type IHubServer } from "../../services/configService.ts";
import { hubInstances, pickHubServer, type TRegionId } from "../../services/arbiterService.ts";

export const hubController: RequestHandler = (req, res) => {
    const arr = (req.query.level as string).split("_");
    const instanceId = arr.pop();
    const level = config.noHubDiscrimination ? arr[0] : arr.join("_");

    let hubServer: IHubServer | undefined;
    if (`${level}_${instanceId}` in hubInstances) {
        hubInstances[`${level}_${instanceId}`].Players += 1;
        const addr = hubInstances[`${level}_${instanceId}`].Hub;
        hubServer = config.hubServers?.find(hub => hub.address == addr);
    }
    if (!hubServer) {
        hubServer = pickHubServer(req.query.regionId as TRegionId);
        hubInstances[`${level}_${instanceId}`] = {
            Players: 1,
            Hub: hubServer.address
        };
    }
    const needToUseUdpProxy = (config.dtls ?? 0) & 1 && hubServer.dtlsUnsupported;
    const addr = hubServer.address.split("%THIS_MACHINE%").join(getReflexiveAddress(req).myAddress);

    if (`${level}_${instanceId}` == req.query.level) {
        res.json(`${needToUseUdpProxy ? "udp_proxy_upstream" : "hub"} ${addr}`);
    } else {
        res.json(`${needToUseUdpProxy ? "udp_proxy_upstream" : "hub"} ${addr} ${instanceId} ${level}`);
    }
};
