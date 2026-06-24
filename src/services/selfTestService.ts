import { selfTestGuildTech } from "../controllers/api/guildTechController.ts";
import { selfTestServersideVendors } from "./serversideVendorsService.ts";

export const runSelfTests = (): void => {
    selfTestServersideVendors();
    selfTestGuildTech();
};
