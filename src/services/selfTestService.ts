import { selfTestTransmutation } from "../controllers/api/artifactTransmutationController.ts";
import { selfTestGuildTech } from "../controllers/api/guildTechController.ts";
import { selfTestServersideVendors } from "./serversideVendorsService.ts";

export const runSelfTests = (): boolean => {
    let allGood = true;
    allGood &&= selfTestServersideVendors();
    allGood &&= selfTestGuildTech();
    allGood &&= selfTestTransmutation();
    return allGood;
};
