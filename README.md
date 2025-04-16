# Space Ninja Server

More information for the moment here: [https://discord.gg/PNNZ3asUuY](https://discord.gg/PNNZ3asUuY)

## Project Status

This project is in active development at <https://onlyg.it/OpenWF/SpaceNinjaServer>.

To get an idea of what functionality you can expect to be missing [have a look through the issues](https://onlyg.it/OpenWF/SpaceNinjaServer/issues?q=&type=all&state=open&labels=-4%2C-10&milestone=0&assignee=0&poster=). However, many things have been implemented and *should* work as expected. Please open an issue for anything where that's not the case and/or the server is reporting errors.

## config.json

SpaceNinjaServer requires a `config.json`. To set it up, you can copy the [config.json.example](config.json.example), which has most cheats disabled.

- `logger.level` can be `fatal`, `error`, `warn`, `info`, `http`, `debug`, or `trace`.
- `myIrcAddresses` can be used to point to an IRC server. If not provided, defaults to `[ myAddress ]`.
- `worldState.lockTime` will lock the time provided in worldState if nonzero, e.g. `1743202800` for night in POE.
