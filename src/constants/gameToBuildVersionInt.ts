import { buildVersionToInt } from "../helpers/versionHelper.ts";
import gameToBuildVersion from "./gameToBuildVersion.ts";

const gameToBuildVersionInt: Record<string, number> = {};
for (const [gameVersion, buildVersion] of Object.entries(gameToBuildVersion)) {
    gameToBuildVersionInt[gameVersion] = buildVersionToInt(buildVersion);
}
export default gameToBuildVersionInt as Record<keyof typeof gameToBuildVersion, number>;
