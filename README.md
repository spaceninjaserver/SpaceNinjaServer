# Space Ninja Server

More information for the moment here: [https://discord.gg/PNNZ3asUuY](https://discord.gg/PNNZ3asUuY)

## Project Status

This project is in active development at <https://onlyg.it/OpenWF/SpaceNinjaServer>.

To get an idea of what functionality you can expect to be missing [have a look through the issues](https://onlyg.it/OpenWF/SpaceNinjaServer/issues?q=&type=all&state=open&labels=-4%2C-10&milestone=0&assignee=0&poster=). However, many things have been implemented and *should* work as expected. Please open an issue for anything where that's not the case and/or the server is reporting errors.

## config.json

SpaceNinjaServer requires a `config.json`. To set it up, you can copy the [config.json.example](config.json.example), which has most cheats disabled.

- `logger.level` can be `fatal`, `error`, `warn`, `info`, `http`, `debug`, or `trace`.
- `myIrcAddresses` can be used to point to an IRC server. If not provided, defaults to `[ myAddress ]`.
- `worldState.eidolonOverride` can be set to `day` or `night` to lock the time to day/fass and night/vome on Plains of Eidolon/Cambion Drift.
- `worldState.vallisOverride` can be set to `warm` or `cold` to lock the temperature on Orb Vallis.
- `worldState.duviriOverride` can be set to `joy`, `anger`, `envy`, `sorrow`, or `fear` to lock the Duviri spiral.
- `worldState.nightwaveOverride` will lock the nightwave season, assuming the client is new enough for it. Valid values:
  - `RadioLegionIntermission13Syndicate` for Nora's Mix Vol. 9
  - `RadioLegionIntermission12Syndicate` for Nora's Mix Vol. 8
  - `RadioLegionIntermission11Syndicate` for Nora's Mix Vol. 7
  - `RadioLegionIntermission10Syndicate` for Nora's Mix Vol. 6
  - `RadioLegionIntermission9Syndicate` for Nora's Mix Vol. 5
  - `RadioLegionIntermission8Syndicate` for Nora's Mix Vol. 4
  - `RadioLegionIntermission7Syndicate` for Nora's Mix Vol. 3
  - `RadioLegionIntermission6Syndicate` for Nora's Mix Vol. 2
  - `RadioLegionIntermission5Syndicate` for Nora's Mix Vol. 1
  - `RadioLegionIntermission4Syndicate` for Nora's Choice
  - `RadioLegionIntermission3Syndicate` for Intermission III
  - `RadioLegion3Syndicate` for Glassmaker
  - `RadioLegionIntermission2Syndicate` for Intermission II
  - `RadioLegion2Syndicate` for The Emissary
  - `RadioLegionIntermissionSyndicate` for Intermission I
  - `RadioLegionSyndicate` for The Wolf of Saturn Six
- `allTheFissures` can be set to `normal` or `hard` to enable all fissures either in normal or steel path, respectively.
- `worldState.circuitGameModes` can be set to an array of game modes which will override the otherwise-random pattern in The Circuit. Valid element values are `Survival`, `VoidFlood`, `Excavation`, `Defense`, `Exterminate`, `Assassination`, and `Alchemy`.
