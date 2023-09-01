/* eslint-disable */
import Warframes from './Warframes.json' assert { type: "json" };
import Gear from './Gear.json' assert { type: "json" };
import Melee from './Melee.json' assert { type: "json" };
import Primary from './Primary.json' assert { type: "json" };
import Secondary from './Secondary.json' assert { type: "json" };
import Sentinels from './Sentinels.json' assert { type: "json" };
import Misc from './Misc.json' assert { type: "json" };
import ArchGun from './Arch-Gun.json' assert { type: "json" };
import ArchMelee from './Arch-Melee.json' assert { type: "json" };
import fs from 'fs';

const formated = {};
Warframes.forEach(j=>{
    j.components?.forEach(i=>{
        if(i.drops && i.drops[0]){
            formated[i.drops[0].type] = i.uniqueName;
        }
    })
});
Gear.forEach(j=>{
    j.components?.forEach(i=>{
        if(i.drops && i.drops[0]){
            formated[i.drops[0].type] = i.uniqueName;
        }
    })
});
Melee.forEach(j=>{
    j.components?.forEach(i=>{
        if(i.drops && i.drops[0]){
            formated[i.drops[0].type] = i.uniqueName;
        }
    })
});
Primary.forEach(j=>{
    j.components?.forEach(i=>{
        if(i.drops && i.drops[0]){
            formated[i.drops[0].type] = i.uniqueName;
        }
    })
});
Secondary.forEach(j=>{
    j.components?.forEach(i=>{
        if(i.drops && i.drops[0]){
            formated[i.drops[0].type] = i.uniqueName;
        }
    })
});
Sentinels.forEach(j=>{
    j.components?.forEach(i=>{
        if(i.drops && i.drops[0]){
            formated[i.drops[0].type] = i.uniqueName;
        }
    })
});
Misc.forEach(j=>{
    j.components?.forEach(i=>{
        if(i.drops && i.drops[0]){
            formated[i.drops[0].type] = i.uniqueName;
        }
    })
});
ArchGun.forEach(j=>{
    j.components?.forEach(i=>{
        if(i.drops && i.drops[0]){
            formated[i.drops[0].type] = i.uniqueName;
        }
    })
});
ArchMelee.forEach(j=>{
    j.components?.forEach(i=>{
        if(i.drops && i.drops[0]){
            formated[i.drops[0].type] = i.uniqueName;
        }
    })
});
formated['Forma Blueprint'] = "/Lotus/StoreItems/Types/Items/MiscItems/Forma";
console.log(formated);

const fileBody =  JSON.stringify(formated);
fs.writeFile("./craft-names.json", fileBody, err => {
    if (err) {
        console.log(err.message);

        throw err;
    }

    console.log('data written to file');
});