import type { RequestHandler } from "express";
import { config, getReflexiveAddress } from "../../services/configService.ts";
import { hubInstances, pickHubServer, type TRegionId } from "../../services/arbiterService.ts";

export const hubController: RequestHandler = (req, res) => {
    const arr = (req.query.level as string).split("_");
    const instanceId = arr.pop();
    const level = config.noHubDiscrimination ? arr[0] : arr.join("_");

    let hubServer: string;
    if (`${level}_${instanceId}` in hubInstances) {
        hubInstances[`${level}_${instanceId}`].Players += 1;
        hubServer = hubInstances[`${level}_${instanceId}`].Hub;
    } else {
        hubServer = pickHubServer(req.query.regionId as TRegionId);
        hubInstances[`${level}_${instanceId}`] = {
            Players: 1,
            Hub: hubServer
        };
    }
    const needToUseUdpProxy =
        (config.dtls ?? 0) & 1 && config.hubServers?.find(x => x.address == hubServer)?.dtlsUnsupported;
    hubServer = hubServer.split("%THIS_MACHINE%").join(getReflexiveAddress(req).myAddress);

    if (`${level}_${instanceId}` == req.query.level) {
        res.json(`${needToUseUdpProxy ? "udp_proxy_upstream" : "hub"} ${hubServer}`);
    } else {
        res.json(`${needToUseUdpProxy ? "udp_proxy_upstream" : "hub"} ${hubServer} ${instanceId} ${level}`);
    }
};
