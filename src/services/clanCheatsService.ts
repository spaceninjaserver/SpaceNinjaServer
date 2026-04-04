import type { TGuildDatabaseDocument } from "../models/guildModel.ts";
import type { IGuildCheats } from "../types/guildTypes.ts";

interface IClanLockCheat {
    isGuildInIdealState: (guild: TGuildDatabaseDocument) => boolean;
    cleanupGuild: (guild: TGuildDatabaseDocument) => string[];
}

export const clanLockCheats: Partial<Record<keyof IGuildCheats, IClanLockCheat>> = {
    noDojoRoomBuildStage: {
        isGuildInIdealState: (guild: TGuildDatabaseDocument) =>
            guild.DojoComponents.every(
                component => component.CompletionTime && component.CompletionTime.getTime() <= Date.now()
            ),
        cleanupGuild: (guild: TGuildDatabaseDocument) => {
            for (const component of guild.DojoComponents) {
                if (!component.CompletionTime || component.CompletionTime.getTime() > Date.now()) {
                    component.CompletionTime = new Date();
                }
            }
            return [
                `{"from":"000000000000000000000000","to":"dojo","msg":{"dojoMsgType":1,"n":1,"a":false,"f":false,"u":""}}`
            ];
        }
    },
    fastDojoRoomDestruction: {
        isGuildInIdealState: (guild: TGuildDatabaseDocument) =>
            guild.DojoComponents.every(
                component => !component.DestructionTime || component.DestructionTime.getTime() <= Date.now()
            ),
        cleanupGuild: (guild: TGuildDatabaseDocument) => {
            for (const component of guild.DojoComponents) {
                if (component.DestructionTime && component.DestructionTime.getTime() > Date.now()) {
                    component.DestructionTime = new Date();
                }
            }
            return [
                `{"from":"000000000000000000000000","to":"dojo","msg":{"dojoMsgType":1,"n":1,"a":false,"f":false,"u":""}}`
            ];
        }
    },
    noDojoDecoBuildStage: {
        isGuildInIdealState: (guild: TGuildDatabaseDocument) =>
            guild.DojoComponents.every(
                component =>
                    !component.Decos ||
                    component.Decos.every(deco => deco.CompletionTime && deco.CompletionTime.getTime() <= Date.now())
            ),
        cleanupGuild: (guild: TGuildDatabaseDocument) => {
            const msgs: string[] = [];
            for (const component of guild.DojoComponents) {
                if (component.Decos) {
                    let anyChanges = false;
                    for (const deco of component.Decos) {
                        if (!deco.CompletionTime || deco.CompletionTime.getTime() > Date.now()) {
                            deco.CompletionTime = new Date();
                            anyChanges = true;
                        }
                    }
                    if (anyChanges) {
                        msgs.push(
                            `{"from":"000000000000000000000000","to":"dojo","msg":{"dojoMsgType":0,"id":"${component._id.toString()}","op":6,"u":""}}`
                        );
                    }
                }
            }
            return msgs;
        }
    }
};
