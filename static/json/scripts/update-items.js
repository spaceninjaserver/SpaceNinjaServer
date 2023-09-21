/* eslint-disable */
const Items = require("warframe-items");
const fs = require("fs");

const weaponCategories = new Items({ category: ["Primary", "Secondary", "Melee"] }).reduce((acc, item) => {
    acc[item.name] = item.productCategory;
    return acc;
}, {});

const allItemTypes = new Items({ category: ["All"] }).map(item => item.uniqueName);

const getNamesObj = category =>
    new Items({ category: [category] }).reduce((acc, item) => {
        acc[item.name.replace("'S", "'s")] = item.uniqueName;
        return acc;
    }, {});

const modNames = getNamesObj("Mods");
const resourceNames = getNamesObj("Resources");
const miscNames = getNamesObj("Misc");
const relicNames = getNamesObj("Relics");
const skinNames = getNamesObj("Skins");
const arcaneNames = getNamesObj("Arcanes");
const gearNames = getNamesObj("Gear");

const craftNames = Object.fromEntries(
    new Items({
        category: ["Warframes", "Gear", "Melee", "Primary", "Secondary", "Sentinels", "Misc", "Arch-Gun", "Arch-Melee"]
    })
        .flatMap(item => item.components || [])
        .filter(item => item.drops && item.drops[0])
        .map(item => [item.drops[0].type, item.uniqueName])
);
craftNames["Forma Blueprint"] = "/Lotus/Types/Recipes/Components/FormaBlueprint";

const blueprintNames = Object.fromEntries(
    Object.keys(craftNames)
        .filter(name => name.includes("Blueprint"))
        .map(name => [name, craftNames[name]])
);

const jsonDir = "static/json";

fs.writeFileSync(`${jsonDir}/weapon-categories.json`, JSON.stringify(weaponCategories));
fs.writeFileSync(`${jsonDir}/all-uniq-names.json`, JSON.stringify(allItemTypes));
fs.writeFileSync(`${jsonDir}/mod-names.json`, JSON.stringify(modNames));
fs.writeFileSync(`${jsonDir}/resource-names.json`, JSON.stringify(resourceNames));
fs.writeFileSync(`${jsonDir}/misc-names.json`, JSON.stringify(miscNames));
fs.writeFileSync(`${jsonDir}/relic-names.json`, JSON.stringify(relicNames));
fs.writeFileSync(`${jsonDir}/skin-names.json`, JSON.stringify(skinNames));
fs.writeFileSync(`${jsonDir}/arcane-names.json`, JSON.stringify(arcaneNames));
fs.writeFileSync(`${jsonDir}/gear-names.json`, JSON.stringify(gearNames));
fs.writeFileSync(`${jsonDir}/blueprint-names.json`, JSON.stringify(blueprintNames));
