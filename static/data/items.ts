import modNamesData from "@/static/json/mod-names.json";
import relicNamesData from "@/static/json/relic-names.json";
import miscNamesData from "@/static/json/misc-names.json";
import resourceNamesData from "@/static/json/resource-names.json";
import gearNamesData from "@/static/json/gear-names.json";
import blueprintNamesData from "@/static/json/blueprint-names.json";
import weaponCategoriesData from "@/static/json/weapon-categories.json";
import allUniqNames from "@/static/json/all-uniq-names.json";

const modNames = modNamesData as ImportAssertions;
const relicNames = relicNamesData as ImportAssertions;
const miscNames = miscNamesData as ImportAssertions;
const resourceNames = resourceNamesData as ImportAssertions;
const gearNames = gearNamesData as ImportAssertions;
const blueprintNames = blueprintNamesData as ImportAssertions;
const weaponCategories = weaponCategoriesData as ImportAssertions;
const items = new Set(allUniqNames);

export { modNames, relicNames, miscNames, resourceNames, gearNames, blueprintNames, weaponCategories, items };
