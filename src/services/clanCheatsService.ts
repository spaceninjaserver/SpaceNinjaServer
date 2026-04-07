import type { TGuildDatabaseDocument } from "../models/guildModel.ts";
import type { IGuildCheats } from "../types/guildTypes.ts";
import { processGuildTechProjectContributionsUpdate } from "./guildService.ts";

interface IClanLockCheat {
    isGuildInIdealState: (guild: TGuildDatabaseDocument) => boolean;
    cleanupGuild: (guild: TGuildDatabaseDocument) => Promise<string[]>;
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
            return Promise.resolve([
                `{"from":"000000000000000000000000","to":"dojo","msg":{"dojoMsgType":1,"n":1,"a":false,"f":false,"u":""}}`
            ]);
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
            return Promise.resolve([
                `{"from":"000000000000000000000000","to":"dojo","msg":{"dojoMsgType":1,"n":1,"a":false,"f":false,"u":""}}`
            ]);
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
            return Promise.resolve(msgs);
        }
    },
    noDojoResearchCosts: {
        isGuildInIdealState: (guild: TGuildDatabaseDocument) => (guild.TechProjects ?? []).every(x => x.CompletionDate),
        cleanupGuild: async (guild: TGuildDatabaseDocument) => {
            for (const techProject of guild.TechProjects!) {
                techProject.ReqCredits = 0;
                for (const item of techProject.ReqItems) {
                    item.ItemCount = 0;
                }
                await processGuildTechProjectContributionsUpdate(guild, techProject);
            }
            // The client sends this message when contributing to guild research, but it doesn't seem to cause it to refresh the UI. :/
            //return [`{"from":"000000000000000000000000","to":"clan","msg":{"dojoMsgType":3,"g":true,"a":false}}`];
            return [];
        }
    },
    noDojoResearchTime: {
        isGuildInIdealState: (guild: TGuildDatabaseDocument) =>
            (guild.TechProjects ?? []).every(x => !x.CompletionDate || x.CompletionDate.getTime() <= Date.now()),
        cleanupGuild: (guild: TGuildDatabaseDocument) => {
            for (const techProject of guild.TechProjects!) {
                if (techProject.CompletionDate && techProject.CompletionDate.getTime() > Date.now()) {
                    techProject.CompletionDate = new Date();
                }
            }
            return Promise.resolve([
                //`{"from":"000000000000000000000000","to":"clan","msg":{"dojoMsgType":3,"g":true,"a":false}}`
            ]);
        }
    }
};
