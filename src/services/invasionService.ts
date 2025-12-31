interface IDeathSquadInfo {
    booleanKey: "DeathSquadable" | "Harvestable";
    numberKey: "DeathSquadPoints" | "HarvesterPoints";
    inboxSender: string;
    inboxIcon: string;
    inboxTitle: string;
    inboxMessage: string;
    inboxMessageRepeat: string;
}

export const grineerDeathSquadInfo: IDeathSquadInfo = {
    booleanKey: "DeathSquadable",
    numberKey: "DeathSquadPoints",
    inboxSender: "/Lotus/Language/Bosses/BossCouncilorVayHek",
    inboxIcon: "/Lotus/Interface/Icons/Npcs/VayHekPortrait.png",
    inboxTitle: "/Lotus/Language/G1Quests/DeathSquadTitle",
    inboxMessage: "/Lotus/Language/G1Quests/DeathSquadMessage",
    inboxMessageRepeat: "/Lotus/Language/G1Quests/DeathSquadMessageRepeat"
};

export const corpusDeathSquadInfo: IDeathSquadInfo = {
    booleanKey: "Harvestable",
    numberKey: "HarvesterPoints",
    inboxSender: "/Lotus/Language/Bosses/BossAladV",
    inboxIcon: "/Lotus/Interface/Icons/Npcs/AladVPortrait_d.png",
    inboxTitle: "/Lotus/Language/G1Quests/HarvesterTitle",
    inboxMessage: "/Lotus/Language/G1Quests/HarvesterkMessage",
    inboxMessageRepeat: "/Lotus/Language/G1Quests/HarvesterkMessageRepeat"
};
