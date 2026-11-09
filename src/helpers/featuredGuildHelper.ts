export const isSpecialIcon = (icon: number | undefined): boolean => icon == 7 || icon == 8;

export const applyFeaturedGuildLimits = <T extends IFeaturedGuildIcon>(guilds: T[]): T[] => {
    const specialIcons = new Set<number>();
    const withIcons = guilds.map(guild => {
        if (isSpecialIcon(guild.icon)) {
            if (specialIcons.has(guild.icon!)) {
                return { ...guild, icon: undefined };
            }
            specialIcons.add(guild.icon!);
        }
        return guild;
    });

    const maxRegularGuilds = 12 - specialIcons.size;
    let numRegularGuilds = 0;
    return withIcons.filter(guild => isSpecialIcon(guild.icon) || numRegularGuilds++ < maxRegularGuilds);
};

export const areFeaturedGuildLimitsRespected = (guilds: IFeaturedGuildIcon[]): boolean => {
    const applied = applyFeaturedGuildLimits(guilds);
    return applied.length == guilds.length && applied.every((guild, i) => guild === guilds[i]);
};

interface IFeaturedGuildIcon {
    icon?: number;
}
