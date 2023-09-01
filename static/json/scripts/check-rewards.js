/* eslint-disable */
import missionsDropTable from '../missions-drop-table.json' assert { type: "json" };
import modNames from '../mod-names.json' assert { type: "json" };
import relicNames from '../relic-names.json' assert { type: "json" };
import skinNames from '../skin-names.json' assert { type: "json" };
import miscNames from '../misc-names.json' assert { type: "json" };
import resourceNames from '../resource-names.json' assert { type: "json" };
import gearNames from '../gear-names.json' assert { type: "json" };
import arcaneNames from '../arcane-names.json' assert { type: "json" };
import craftNames from '../craft-names.json' assert { type: "json" };

let tempRewards = [];
missionsDropTable.forEach(i=>{
    i.rewards.forEach(j=>{
        tempRewards.push(j);
    });
});
tempRewards = tempRewards
    .filter(i=>!modNames[i.name])
    .filter(i=>!relicNames[i.name.replace('Relic','Exceptional')] && !relicNames[i.name.replace('Relic (Radiant)','Radiant')])
    .filter(i=>!skinNames[i.name])
    .filter(i=>!miscNames[i.name])
    .filter(i=>!miscNames[i.name.replace(/\d+X\s*/, '')])
    .filter(i=>!resourceNames[i.name])
    .filter(i=>!resourceNames[i.name.replace(/\d+X\s*/, '')])
    .filter(i=>!gearNames[i.name])
    .filter(i=>!arcaneNames[i.name])
    .filter(i=>!craftNames[i.name])
    .filter(i=>!i.name.includes(' Endo'))
    .filter(i=>!i.name.includes(' Credits Cache') && !i.name.includes('Return: '));
console.log(tempRewards);