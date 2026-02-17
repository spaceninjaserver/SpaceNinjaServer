/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

let auth_pending = false,
    did_initial_auth = false,
    ws_is_open = false,
    wsid = 0,
    ws_reconnect = false;
const sendAuth = isRegister => {
    if (ws_is_open && localStorage.getItem("email") && localStorage.getItem("password")) {
        auth_pending = true;
        window.ws.send(
            JSON.stringify({
                auth: {
                    email: localStorage.getItem("email").toLowerCase(),
                    password: wp.encSync(localStorage.getItem("password")),
                    isRegister
                }
            })
        );
        return true;
    }
    return false;
};

function openWebSocket() {
    const wsProto = location.protocol === "https:" ? "wss://" : "ws://";
    window.ws = new WebSocket(wsProto + location.host + "/custom/ws");
    window.ws.onopen = () => {
        ws_is_open = true;
        sendAuth(false);
    };
    window.ws.onmessage = e => {
        const msg = JSON.parse(e.data);
        if ("wsid" in msg) {
            wsid = msg.wsid;
        }
        if ("reload" in msg) {
            setTimeout(() => {
                getWebSocket().then(() => {
                    location.reload();
                });
            }, 100);
        }
        if ("ports" in msg) {
            location.port = location.protocol == "https:" ? msg.ports.https : msg.ports.http;
        }
        if ("config_reloaded" in msg) {
            refreshServerConfig();
        }
        if ("auth_succ" in msg) {
            auth_pending = false;
            const data = msg.auth_succ;
            if (single.getCurrentPath() == "/webui/") {
                single.loadRoute("/webui/inventory");
            }
            $("#email").val("");
            $("#password").val("");
            $(".displayname").text(data.DisplayName);
            window.accountId = data.id;
            window.authz = "accountId=" + data.id + "&nonce=" + data.Nonce + "&wsid=" + wsid;
            if (window.dict) {
                updateLocElements();
            }
            if (!did_initial_auth) {
                did_initial_auth = true;
                updateInventory();
            }
            if (ws_reconnect) {
                ws_reconnect = false;
                // Config may have changed during the time we were disconnected.
                refreshServerConfig();
            }
        }
        if ("auth_fail" in msg) {
            auth_pending = false;
            logout();
            if (single.getCurrentPath() == "/webui/") {
                alert(loc(msg.auth_fail.isRegister ? "code_regFail" : "code_loginFail"));
            } else {
                single.loadRoute("/webui/");
            }
        }
        if ("nonce_updated" in msg) {
            if (!sendAuth()) {
                single.loadRoute("/webui/"); // Show login screen
            }
        }
        if ("update_inventory" in msg) {
            updateInventory();
        }
        if ("logged_out" in msg) {
            logout();
            single.loadRoute("/webui/"); // Show login screen
        }
        if ("have_game_ws" in msg) {
            window.have_game_ws = msg.have_game_ws;
            if (window.dict) {
                $(".inventory-update-note").text(
                    loc(msg.have_game_ws ? "general_inventoryUpdateNoteGameWs" : "general_inventoryUpdateNote")
                );
            }
        }
    };
    window.ws.onclose = function () {
        ws_is_open = false;
        ws_reconnect = true;
        setTimeout(openWebSocket, 3000);
    };
}
openWebSocket();

function refreshServerConfig() {
    //window.is_admin = undefined;
    if (single.getCurrentPath() == "/webui/cheats") {
        single.loadRoute("/webui/cheats");
    }
}

function getWebSocket() {
    return new Promise(resolve => {
        let interval;
        interval = setInterval(() => {
            if (ws_is_open) {
                clearInterval(interval);
                resolve(window.ws);
            }
        }, 10);
    });
}

window.registerSubmit = false;

function doLogin() {
    if (auth_pending) {
        return;
    }
    localStorage.setItem("email", $("#email").val());
    localStorage.setItem("password", $("#password").val());
    sendAuth(registerSubmit);
    window.registerSubmit = false;
}

function revalidateAuthz() {
    return new Promise(resolve => {
        let interval;
        interval = setInterval(() => {
            if (ws_is_open && !auth_pending) {
                clearInterval(interval);
                resolve();
            }
        }, 10);
    });
}

function logout() {
    localStorage.removeItem("email");
    localStorage.removeItem("password");
    did_initial_auth = false;
}

function doLogout() {
    logout();
    if (ws_is_open) {
        // Unsubscribe from notifications about nonce invalidation
        window.ws.send(JSON.stringify({ logout: true }));
    }
}

function renameAccount(taken_name) {
    const newname = window.prompt(
        (taken_name ? loc("code_changeNameRetry").split("|NAME|").join(taken_name) + " " : "") +
            loc("code_changeNameConfirm")
    );
    if (newname) {
        revalidateAuthz().then(() => {
            fetch("/custom/renameAccount?" + window.authz + "&newname=" + encodeURIComponent(newname)).then(res => {
                if (res.status == 200) {
                    $(".displayname").text(newname);
                    updateLocElements();
                    toast(loc("code_succRelog"));
                } else if (res.status == 409) {
                    renameAccount(newname);
                } else {
                    toast(loc("code_genFail"));
                }
            });
        });
    }
}

function deleteAccount() {
    if (window.confirm(loc("code_deleteAccountConfirm"))) {
        revalidateAuthz().then(() => {
            fetch("/custom/deleteAccount?" + window.authz).then(() => {
                logout();
                single.loadRoute("/webui/"); // Show login screen
            });
        });
    }
}

single.on("route_load", function (event) {
    if (event.route.paths[0] != "/webui/") {
        // Authorised route?
        if (!localStorage.getItem("email")) {
            // Not logged in?
            return single.loadRoute("/webui/"); // Show login screen
        }
        $("body").addClass("logged-in");
    } else {
        $("body").removeClass("logged-in");
    }

    $("#sidebar .nav-link").removeClass("active");
    const navLink = document.querySelector(".nav-link[href='" + event.route.paths[0] + "']");
    if (navLink) {
        navLink.classList.add("active");
    }
});

function loc(tag) {
    return ((window.dict ?? {})[tag] ?? tag)
        .split("|DISPLAYNAME|")
        .join(document.querySelector(".displayname").textContent)
        .split("|EMAIL|")
        .join(localStorage.getItem("email"));
}

function updateLocElements() {
    document.querySelectorAll("[data-loc]").forEach(elm => {
        elm.innerHTML = loc(elm.getAttribute("data-loc"));
    });
    document.querySelectorAll("[data-loc-placeholder]").forEach(elm => {
        elm.placeholder = loc(elm.getAttribute("data-loc-placeholder"));
    });
    document.querySelectorAll("[data-loc-inc]").forEach(elm => {
        const incWith = elm
            .getAttribute("data-loc-inc")
            .split("|")
            .map(key => loc(key).replace(/<[^>]+>/g, ""))
            .join(", ");
        elm.title = `${loc("worldState_incompatibleWith")} ${incWith}`;
    });
    document.querySelectorAll("[data-loc-replace]").forEach(elm => {
        elm.innerHTML = elm.innerHTML.replace("|VAL|", elm.getAttribute("data-loc-replace"));
    });
    $(".inventory-update-note").text(
        loc(window.have_game_ws ? "general_inventoryUpdateNoteGameWs" : "general_inventoryUpdateNote")
    );
}

function setActiveLanguage(lang) {
    window.lang = lang;
    const lang_name = document.querySelector("[data-lang=" + lang + "]").textContent;
    document.getElementById("active-lang-name").textContent = lang_name;
    document.querySelector("[data-lang].active").classList.remove("active");
    document.querySelector("[data-lang=" + lang + "]").classList.add("active");

    window.dictPromise = new Promise(resolve => {
        const webui_lang = ["en", "ru", "fr", "de", "zh", "es", "uk"].indexOf(lang) == -1 ? "en" : lang;
        let script = document.getElementById("translations");
        if (script) document.documentElement.removeChild(script);

        script = document.createElement("script");
        script.id = "translations";
        script.src = "/translations/" + webui_lang + ".js";
        script.onload = function () {
            updateLocElements();
            resolve(window.dict);
        };
        document.documentElement.appendChild(script);
    });
}
setActiveLanguage(localStorage.getItem("lang") ?? "en");

function setLanguage(lang) {
    setActiveLanguage(lang);
    localStorage.setItem("lang", lang);
    if (window.authz) {
        // Not in prelogin state?
        fetchItemList();
        updateInventory();
    }
}

function setActiveTheme(theme) {
    document.documentElement.setAttribute("data-bs-theme", theme);
    document.querySelector("[data-theme].active").classList.remove("active");
    document.querySelector("[data-theme=" + theme + "]").classList.add("active");
}
setActiveTheme(localStorage.getItem("theme") ?? "dark");

function setTheme(theme) {
    setActiveTheme(theme);
    localStorage.setItem("theme", theme);
}

const webUiModularWeapons = [
    "/Lotus/Weapons/Sentients/OperatorAmplifiers/OperatorAmpWeapon",
    "/Lotus/Weapons/Ostron/Melee/LotusModularWeapon",
    "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimary",
    "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondary",
    "/Lotus/Types/Friendly/Pets/MoaPets/MoaPetPowerSuit",
    "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetPowerSuit",
    "/Lotus/Types/Friendly/Pets/CreaturePets/VulpineInfestedCatbrowPetPowerSuit",
    "/Lotus/Types/Friendly/Pets/CreaturePets/HornedInfestedCatbrowPetPowerSuit",
    "/Lotus/Types/Friendly/Pets/CreaturePets/ArmoredInfestedCatbrowPetPowerSuit",
    "/Lotus/Types/Friendly/Pets/CreaturePets/VizierPredatorKubrowPetPowerSuit",
    "/Lotus/Types/Friendly/Pets/CreaturePets/PharaohPredatorKubrowPetPowerSuit",
    "/Lotus/Types/Friendly/Pets/CreaturePets/MedjayPredatorKubrowPetPowerSuit"
];

const permanentEvolutionWeapons = new Set([
    "/Lotus/Weapons/Tenno/Zariman/LongGuns/PumpShotgun/ZarimanPumpShotgun",
    "/Lotus/Weapons/Tenno/Zariman/LongGuns/SemiAutoRifle/ZarimanSemiAutoRifle",
    "/Lotus/Weapons/Tenno/Zariman/Melee/Dagger/ZarimanDaggerWeapon",
    "/Lotus/Weapons/Tenno/Zariman/Melee/Tonfas/ZarimanTonfaWeapon",
    "/Lotus/Weapons/Tenno/Zariman/Pistols/HeavyPistol/ZarimanHeavyPistol",
    "/Lotus/Weapons/Thanotech/EntFistIncarnon/EntFistIncarnon",
    "/Lotus/Weapons/Thanotech/EntratiWristGun/EntratiWristGunWeapon",
    "/Lotus/Weapons/Tenno/Zariman/Melee/HeavyScythe/ZarimanHeavyScythe/ZarimanHeavyScytheWeapon"
]);

const itemToString = item => item.name;
const itemToStringWithSubtype = item => (item.subtype ? item.name + " (" + item.subtype + ")" : item.name);
const itemToStringWithUniqueName = item => item.name + " [" + item.uniqueName.split("/").pop() + "]";

const areItemsUnambiguous = (items, stringifier) => {
    const set = new Set();
    for (const item of items) {
        const str = stringifier(item);
        if (set.has(str)) {
            return false;
        }
        set.add(str);
    }
    return true;
};

function fetchItemList() {
    window.itemListPromise = new Promise(resolve => {
        const req = $.get("/custom/getItemLists?lang=" + window.lang);
        req.done(async data => {
            await dictPromise;

            document.querySelectorAll('[id^="datalist-"]').forEach(datalist => {
                datalist.innerHTML = "";
            });

            const syndicateNone = document.createElement("option");
            syndicateNone.value = "";
            syndicateNone.textContent = loc("general_none");
            document.getElementById("changeSyndicate").innerHTML = "";
            document.getElementById("changeSyndicate").appendChild(syndicateNone);

            document.getElementById("valenceBonus-innateDamage").innerHTML = "";
            document.getElementById("worldState.varziaOverride").innerHTML = "";

            // prettier-ignore
            data.archonCrystalUpgrades = {
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeEquilibrium": loc("upgrade_Equilibrium").split("|VAL|").join("20"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeEquilibriumMythic": loc("upgrade_Equilibrium").split("|VAL|").join("30"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeMeleeCritDamage": loc("upgrade_MeleeCritDamage").split("|VAL|").join("25"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeMeleeCritDamageMythic": loc("upgrade_MeleeCritDamage").split("|VAL|").join("37.5"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradePrimaryStatusChance": loc("upgrade_PrimaryStatusChance").split("|VAL|").join("25"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradePrimaryStatusChanceMythic": loc("upgrade_PrimaryStatusChance").split("|VAL|").join("37.5"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeSecondaryCritChance": loc("upgrade_SecondaryCritChance").split("|VAL|").join("25"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeSecondaryCritChanceMythic": loc("upgrade_SecondaryCritChance").split("|VAL|").join("37.5"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeAbilityDuration": loc("upgrade_WarframeAbilityDuration").split("|VAL|").join("10"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeAbilityDurationMythic": loc("upgrade_WarframeAbilityDuration").split("|VAL|").join("15"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeAbilityStrength": loc("upgrade_WarframeAbilityStrength").split("|VAL|").join("10"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeAbilityStrengthMythic": loc("upgrade_WarframeAbilityStrength").split("|VAL|").join("15"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeArmourMax": loc("upgrade_WarframeArmorMax").split("|VAL|").join("150"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeArmourMaxMythic": loc("upgrade_WarframeArmorMax").split("|VAL|").join("225"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeBlastProc": loc("upgrade_WarframeBlastProc").split("|VAL|").join("5"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeBlastProcMythic": loc("upgrade_WarframeBlastProc").split("|VAL|").join("7.5"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeCastingSpeed": loc("upgrade_WarframeCastingSpeed").split("|VAL|").join("25"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeCastingSpeedMythic": loc("upgrade_WarframeCastingSpeed").split("|VAL|").join("37.5"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeCorrosiveDamageBoost": loc("upgrade_WarframeCorrosiveDamageBoost").split("|VAL|").join("10"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeCorrosiveDamageBoostMythic": loc("upgrade_WarframeCorrosiveDamageBoost").split("|VAL|").join("15"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeCorrosiveStack": loc("upgrade_WarframeCorrosiveStack").split("|VAL|").join("2"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeCorrosiveStackMythic": loc("upgrade_WarframeCorrosiveStack").split("|VAL|").join("3"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeCritDamageBoost": loc("upgrade_WarframeCritDamageBoost").split("|VAL|").join("25"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeCritDamageBoostMythic": loc("upgrade_WarframeCritDamageBoost").split("|VAL|").join("37"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeElectricDamage": loc("upgrade_WarframeElectricDamage").split("|VAL1|").join("30").split("|VAL2|").join("10"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeElectricDamageMythic": loc("upgrade_WarframeElectricDamage").split("|VAL1|").join("45").split("|VAL2|").join("15"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeElectricDamageBoost": loc("upgrade_WarframeElectricDamageBoost").split("|VAL|").join("10"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeElectricDamageBoostMythic": loc("upgrade_WarframeElectricDamageBoost").split("|VAL|").join("15"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeEnergyMax": loc("upgrade_WarframeEnergyMax").split("|VAL|").join("50"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeEnergyMaxMythic": loc("upgrade_WarframeEnergyMax").split("|VAL|").join("75"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeGlobeEffectEnergy": loc("upgrade_WarframeGlobeEffectEnergy").split("|VAL|").join("50"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeGlobeEffectEnergyMythic": loc("upgrade_WarframeGlobeEffectEnergy").split("|VAL|").join("75"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeGlobeEffectHealth": loc("upgrade_WarframeGlobeEffectHealth").split("|VAL|").join("100"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeGlobeEffectHealthMythic": loc("upgrade_WarframeGlobeEffectHealth").split("|VAL|").join("150"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeHealthMax": loc("upgrade_WarframeHealthMax").split("|VAL|").join("150"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeHealthMaxMythic": loc("upgrade_WarframeHealthMax").split("|VAL|").join("225"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeHPBoostFromImpact": loc("upgrade_WarframeHPBoostFromImpact").split("|VAL1|").join("1").split("|VAL2|").join("300"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeHPBoostFromImpactMythic": loc("upgrade_WarframeHPBoostFromImpact").split("|VAL1|").join("2").split("|VAL2|").join("450"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeParkourVelocity": loc("upgrade_WarframeParkourVelocity").split("|VAL|").join("15"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeParkourVelocityMythic": loc("upgrade_WarframeParkourVelocity").split("|VAL|").join("22.5"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeRadiationDamageBoost": loc("upgrade_WarframeRadiationDamageBoost").split("|VAL|").join("10"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeRadiationDamageBoostMythic": loc("upgrade_WarframeRadiationDamageBoost").split("|VAL|").join("15"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeRegen": loc("upgrade_WarframeHealthRegen").split("|VAL|").join("5"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeRegenMythic": loc("upgrade_WarframeHealthRegen").split("|VAL|").join("7.5"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeShieldMax": loc("upgrade_WarframeShieldMax").split("|VAL|").join("150"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeShieldMaxMythic": loc("upgrade_WarframeShieldMax").split("|VAL|").join("225"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeStartingEnergy": loc("upgrade_WarframeStartingEnergy").split("|VAL|").join("30"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeStartingEnergyMythic": loc("upgrade_WarframeStartingEnergy").split("|VAL|").join("45"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeToxinDamage": loc("upgrade_WarframeToxinDamage").split("|VAL|").join("30"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeToxinDamageMythic": loc("upgrade_WarframeToxinDamage").split("|VAL|").join("45"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeToxinHeal": loc("upgrade_WarframeToxinHeal").split("|VAL|").join("2"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWarframeToxinHealMythic": loc("upgrade_WarframeToxinHeal").split("|VAL|").join("3"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWeaponCritBoostFromHeat": loc("upgrade_WeaponCritBoostFromHeat").split("|VAL1|").join("1").split("|VAL2|").join("50"),
                "/Lotus/Upgrades/Invigorations/ArchonCrystalUpgrades/ArchonCrystalUpgradeWeaponCritBoostFromHeatMythic": loc("upgrade_WeaponCritBoostFromHeat").split("|VAL1|").join("1.5").split("|VAL2|").join("75"),
                "/Lotus/Upgrades/Mods/Warframe/AvatarAbilityRangeMod": loc("upgrade_AvatarAbilityRange"),
                "/Lotus/Upgrades/Mods/Warframe/AvatarAbilityEfficiencyMod": loc("upgrade_AvatarAbilityEfficiency"),
                "/Lotus/Upgrades/Mods/Warframe/AvatarEnergyRegenMod": loc("upgrade_AvatarEnergyRegen"),
                "/Lotus/Upgrades/Mods/Warframe/AvatarEnemyRadarMod": loc("upgrade_AvatarEnemyRadar"),
                "/Lotus/Upgrades/Mods/Warframe/AvatarLootRadarMod": loc("upgrade_AvatarLootRadar"),
                "/Lotus/Upgrades/Mods/Rifle/WeaponAmmoMaxMod": loc("upgrade_WeaponAmmoMax"),
                "/Lotus/Upgrades/Mods/Aura/EnemyArmorReductionAuraMod": loc("upgrade_EnemyArmorReductionAura"),
                "/Lotus/Upgrades/Mods/DataSpike/Assassin/OnExecutionAmmoMod": loc("upgrade_OnExecutionAmmo"),
                "/Lotus/Upgrades/Mods/DataSpike/Assassin/OnExecutionHealthDropMod": loc("upgrade_OnExecutionHealthDrop"),
                "/Lotus/Upgrades/Mods/DataSpike/Assassin/OnExecutionEnergyDropMod": loc("upgrade_OnExecutionEnergyDrop"),
                "/Lotus/Upgrades/Mods/DataSpike/Cipher/OnFailHackResetMod": loc("upgrade_OnFailHackReset"),
                "/Lotus/Upgrades/Mods/DataSpike/Cipher/DamageReductionOnHackMod": loc("upgrade_DamageReductionOnHack"),
                "/Lotus/Upgrades/Mods/DataSpike/Assassin/OnExecutionReviveCompanionMod": loc("upgrade_OnExecutionReviveCompanion"),
                "/Lotus/Upgrades/Mods/DataSpike/Assassin/OnExecutionParkourSpeedMod": loc("upgrade_OnExecutionParkourSpeed"),
                "/Lotus/Upgrades/Mods/Warframe/AvatarTimeLimitIncreaseMod": loc("upgrade_AvatarTimeLimitIncrease"),
                "/Lotus/Upgrades/Mods/DataSpike/Cipher/ElectrifyOnHackMod": loc("upgrade_ElectrifyOnHack"),
                "/Lotus/Upgrades/Mods/DataSpike/Assassin/OnExecutionTerrifyMod": loc("upgrade_OnExecutionTerrify"),
                "/Lotus/Upgrades/Mods/DataSpike/Cipher/OnHackLockersMod": loc("upgrade_OnHackLockers"),
                "/Lotus/Upgrades/Mods/DataSpike/Assassin/OnExecutionBlindMod": loc("upgrade_OnExecutionBlind"),
                "/Lotus/Upgrades/Mods/DataSpike/Assassin/OnExecutionDrainPowerMod": loc("upgrade_OnExecutionDrainPower"),
                "/Lotus/Upgrades/Mods/DataSpike/Cipher/OnHackSprintSpeedMod": loc("upgrade_OnHackSprintSpeed"),
                "/Lotus/Upgrades/Mods/DataSpike/Assassin/SwiftExecuteMod": loc("upgrade_SwiftExecute"),
                "/Lotus/Upgrades/Mods/DataSpike/Cipher/OnHackInvisMod": loc("upgrade_OnHackInvis"),
            };
            window.archonCrystalUpgrades = data.archonCrystalUpgrades;

            data.innateDamages = {
                InnateElectricityDamage: loc("damageType_Electricity"),
                InnateFreezeDamage: loc("damageType_Freeze"),
                InnateHeatDamage: loc("damageType_Fire"),
                InnateImpactDamage: loc("damageType_Impact"),
                InnateMagDamage: loc("damageType_Magnetic"),
                InnateRadDamage: loc("damageType_Radiation"),
                InnateToxinDamage: loc("damageType_Poison")
            };

            // Add mods missing in data sources
            data.mods.push({
                uniqueName: "/Lotus/Upgrades/Mods/Fusers/CommonModFuser",
                name: loc("code_fusionCoreCommon"),
                fusionLimit: 3
            });
            data.mods.push({
                uniqueName: "/Lotus/Upgrades/Mods/Fusers/UncommonModFuser",
                name: loc("code_fusionCoreUncommon"),
                fusionLimit: 5
            });
            data.mods.push({
                uniqueName: "/Lotus/Upgrades/Mods/Fusers/RareModFuser",
                name: loc("code_fusionCoreRare"),
                fusionLimit: 5
            });
            data.mods.push({
                uniqueName: "/Lotus/Upgrades/Mods/Fusers/LegendaryModFuser",
                name: loc("code_legendaryCore"),
                fusionLimit: 0
            });
            data.mods.push({
                uniqueName: "/Lotus/Upgrades/CosmeticEnhancers/Peculiars/CyoteMod",
                name: loc("code_traumaticPeculiar")
            });

            // Add modular weapons
            data.OperatorAmps.push({
                uniqueName: "/Lotus/Weapons/Sentients/OperatorAmplifiers/OperatorAmpWeapon",
                name: loc("code_amp")
            });
            data.Melee.push({
                uniqueName: "/Lotus/Weapons/Ostron/Melee/LotusModularWeapon",
                name: loc("code_zaw")
            });
            data.LongGuns.push({
                uniqueName: "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimary",
                name: loc("code_kitgun")
            });
            data.Pistols.push({
                uniqueName: "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondary",
                name: loc("code_kitgun")
            });
            data.MoaPets ??= [];
            data.MoaPets.push({
                uniqueName: "/Lotus/Types/Friendly/Pets/MoaPets/MoaPetPowerSuit",
                name: loc("code_moa")
            });
            data.MoaPets.push({
                uniqueName: "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetPowerSuit",
                name: loc("code_zanuka")
            });

            data.miscitems.push({
                uniqueName: "/Lotus/Types/Items/Research/DojoColors/GenericDojoColorPigment",
                name: loc("code_pigment")
            });

            data.miscitems.push({
                uniqueName: "/Lotus/Types/Items/MiscItems/BossNavCode",
                name: loc("code_bossNavCode")
            });

            data.VarziaOffers.unshift({
                uniqueName: "",
                name: loc("disabled")
            });

            data.Boosters ??= [];
            data.Boosters.push({
                uniqueName: "/Lotus/Types/Boosters/ReviveBooster",
                name: loc("code_reviveBooster")
            });

            const itemMap = {
                // Generics for rivens
                "/Lotus/Weapons/Tenno/Archwing/Primary/ArchGun": { name: loc("code_archgun") },
                "/Lotus/Weapons/Tenno/Melee/PlayerMeleeWeapon": { name: loc("code_melee") },
                "/Lotus/Weapons/Tenno/Pistol/LotusPistol": { name: loc("code_pistol") },
                "/Lotus/Weapons/Tenno/Rifle/LotusRifle": { name: loc("code_rifle") },
                "/Lotus/Weapons/Tenno/Shotgun/LotusShotgun": { name: loc("code_shotgun") },
                // Modular weapons
                "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryBeam": { name: loc("code_kitgun") },
                "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryLauncher": { name: loc("code_kitgun") },
                "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryShotgun": { name: loc("code_kitgun") },
                "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimarySniper": { name: loc("code_kitgun") },
                "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondaryBeam": { name: loc("code_kitgun") },
                "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondaryShotgun": { name: loc("code_kitgun") },
                "/Lotus/Weapons/Sentients/OperatorAmplifiers/SentTrainingAmplifier/OperatorTrainingAmpWeapon": {
                    name: loc("code_moteAmp")
                },
                "/Lotus/Types/Vehicles/Hoverboard/HoverboardSuit": { name: loc("code_kDrive") },
                "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetAPowerSuit": {
                    name: data.ModularParts.find(
                        i => i.uniqueName === "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHeadA"
                    ).name
                },
                "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetBPowerSuit": {
                    name: data.ModularParts.find(
                        i => i.uniqueName === "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHeadB"
                    ).name
                },
                "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetCPowerSuit": {
                    name: data.ModularParts.find(
                        i => i.uniqueName === "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHeadC"
                    ).name
                },
                "/Lotus/Powersuits/Stalker/Stalker": {
                    name: loc("code_stalker")
                },
                "/Lotus/Language/Game/Rank_Creator": {
                    name: loc("guildView_rank_creator")
                },
                "/Lotus/Language/Game/Rank_Warlord": {
                    name: loc("guildView_rank_warlord")
                },
                "/Lotus/Language/Game/Rank_General": {
                    name: loc("guildView_rank_general")
                },
                "/Lotus/Language/Game/Rank_Officer": {
                    name: loc("guildView_rank_officer")
                },
                "/Lotus/Language/Game/Rank_Leader": {
                    name: loc("guildView_rank_leader")
                },
                "/Lotus/Language/Game/Rank_Sage": {
                    name: loc("guildView_rank_sage")
                },
                "/Lotus/Language/Game/Rank_Soldier": {
                    name: loc("guildView_rank_soldier")
                },
                "/Lotus/Language/Game/Rank_Initiate": {
                    name: loc("guildView_rank_initiate")
                },
                "/Lotus/Language/Game/Rank_Utility": {
                    name: loc("guildView_rank_utility")
                }
            };
            for (const [type, items] of Object.entries(data)) {
                if (type == "archonCrystalUpgrades") {
                    Object.entries(items).forEach(([uniqueName, name]) => {
                        const option = document.createElement("option");
                        option.setAttribute("data-key", uniqueName);
                        option.value = name;
                        document.getElementById("datalist-" + type).appendChild(option);
                    });
                } else if (type == "innateDamages") {
                    Object.entries(items).forEach(([uniqueName, name]) => {
                        const option = document.createElement("option");
                        option.value = uniqueName;
                        option.textContent = name;
                        document.getElementById("valenceBonus-innateDamage").appendChild(option);
                    });
                } else if (type == "VarziaOffers") {
                    items.forEach(item => {
                        const option = document.createElement("option");
                        option.value = item.uniqueName;
                        option.textContent = item.name;
                        document.getElementById("worldState.varziaOverride").appendChild(option);
                    });
                } else if (type == "Syndicates") {
                    items.forEach(item => {
                        if (["ConclaveSyndicate", "NightcapJournalSyndicate"].includes(item.uniqueName)) {
                            return;
                        }
                        if (item.uniqueName.startsWith("RadioLegion")) {
                            item.name += " (" + item.uniqueName + ")";
                        }
                        const option = document.createElement("option");
                        option.value = item.uniqueName;
                        option.textContent = item.name;
                        document.getElementById("changeSyndicate").appendChild(option);
                    });
                } else if (type == "FlavourItems") {
                    const cursorPrefixes = {
                        Controller: loc("code_controller"),
                        MouseGrey: loc("code_mouse"),
                        MouseLine: loc("code_mouseLine"),
                        Mouse: loc("code_mouse")
                    };
                    items.forEach(item => {
                        if (item.uniqueName.startsWith("/Lotus/Interface/Graphics/CustomUI/Cursors/")) {
                            let base = item.uniqueName.replace("/Lotus/Interface/Graphics/CustomUI/Cursors/", "");
                            for (const key in cursorPrefixes) {
                                if (base.startsWith(key)) {
                                    const prefix = cursorPrefixes[key];
                                    const suffix = base.slice(key.length);
                                    item.name = prefix + " " + suffix;
                                    break;
                                }
                            }
                        } else if (item.uniqueName.includes("ColourPicker")) {
                            item.name = loc("code_itemColorPalette").split("|ITEM|").join(item.name);
                        }
                        if (!item.alwaysAvailable) {
                            const option = document.createElement("option");
                            option.setAttribute("data-key", item.uniqueName);
                            option.value = item.name;
                            document.getElementById("datalist-" + type).appendChild(option);
                        }
                        itemMap[item.uniqueName] = { ...item, type };
                    });
                } else if (type == "WeaponSkins") {
                    let beardNumber = 1;
                    items.forEach(item => {
                        if (item.name == "") {
                            if (item.uniqueName.includes("/Beards/")) {
                                item.name = loc("code_drifterBeardName")
                                    .split("|INDEX|")
                                    .join(beardNumber.toString().padStart(3, "0"));
                                beardNumber++;
                            } else {
                                item.name = item.uniqueName;
                            }
                        }
                        if (!item.alwaysAvailable) {
                            const option = document.createElement("option");
                            option.setAttribute("data-key", item.uniqueName);
                            option.value = item.name;
                            document.getElementById("datalist-" + type).appendChild(option);
                        }
                        itemMap[item.uniqueName] = { ...item, type };
                    });
                } else {
                    const nameToItems = {};
                    items.forEach(item => {
                        item.name = item.name.replace(/<.+>/g, "").trim();
                        if ("badReason" in item) {
                            if (item.badReason == "starter") {
                                item.name = loc("code_starter").split("|MOD|").join(item.name);
                            } else if (item.badReason != "notraw") {
                                item.name += " " + loc("code_badItem");
                            }
                        }
                        nameToItems[item.name] ??= [];
                        nameToItems[item.name].push(item);
                    });

                    items.forEach(item => {
                        if (type == "ModularParts") {
                            const supportedModularParts = [
                                "LWPT_HB_DECK",
                                "LWPT_HB_ENGINE",
                                "LWPT_HB_FRONT",
                                "LWPT_HB_JET",
                                "LWPT_AMP_OCULUS",
                                "LWPT_AMP_CORE",
                                "LWPT_AMP_BRACE",
                                "LWPT_BLADE",
                                "LWPT_HILT",
                                "LWPT_HILT_WEIGHT",
                                "LWPT_GUN_PRIMARY_HANDLE",
                                "LWPT_GUN_SECONDARY_HANDLE",
                                "LWPT_GUN_BARREL",
                                "LWPT_GUN_CLIP",
                                "LWPT_MOA_ENGINE",
                                "LWPT_MOA_PAYLOAD",
                                "LWPT_MOA_HEAD",
                                "LWPT_MOA_LEG",
                                "LWPT_ZANUKA_BODY",
                                "LWPT_ZANUKA_HEAD",
                                "LWPT_ZANUKA_LEG",
                                "LWPT_ZANUKA_TAIL",
                                "LWPT_CATBROW_ANTIGEN",
                                "LWPT_CATBROW_MUTAGEN",
                                "LWPT_KUBROW_ANTIGEN",
                                "LWPT_KUBROW_MUTAGEN"
                            ];
                            if (supportedModularParts.includes(item.partType)) {
                                const option = document.createElement("option");
                                option.setAttribute("data-key", item.uniqueName);
                                option.value = item.name;
                                document
                                    .getElementById("datalist-" + type + "-" + item.partType.slice(5))
                                    .appendChild(option);
                            }
                        } else if (item.badReason != "notraw") {
                            let stringifier = itemToString;
                            if (nameToItems[item.name].length > 1) {
                                stringifier = itemToStringWithSubtype;
                                if (!areItemsUnambiguous(nameToItems[item.name], stringifier)) {
                                    stringifier = itemToStringWithUniqueName;
                                    if (!areItemsUnambiguous(nameToItems[item.name], stringifier)) {
                                        console.log(
                                            `Not adding ${item.uniqueName} to datalist for ${type} due to ambiguous display name: ${item.name}`
                                        );
                                        return;
                                    }
                                }
                            }
                            const option = document.createElement("option");
                            option.setAttribute("data-key", item.uniqueName);
                            option.value = stringifier(item);
                            document.getElementById("datalist-" + type).appendChild(option);
                            if (item.eligibleForVault) {
                                const vaultOption = option.cloneNode(true);
                                document.getElementById("datalist-VaultMiscItems").appendChild(vaultOption);
                            }
                        }
                        itemMap[item.uniqueName] = { ...item, type };
                    });
                }
            }
            resolve(itemMap);
        });
    });
}
fetchItemList();

const accountCheats = document.querySelectorAll("#account-cheats input[id]");

let inventory_data;
// Assumes that caller revalidates authz
function getInventoryData() {
    return new Promise((resolve, reject) => {
        if (inventory_data) {
            resolve(inventory_data);
        } else {
            $.get("/api/inventory.php?" + window.authz + "&xpBasedLevelCapDisabled=1&ignoreBuildLabel=1")
                .done(data => {
                    inventory_data = data;
                    resolve(inventory_data);
                })
                .fail(reject);
        }
    });
}

// Assumes that caller revalidates authz
function updateInventory() {
    inventory_data = undefined;
    translateInventoryDataToDom();
}

function translateInventoryDataToDom() {
    getInventoryData().then(data => {
        window.itemListPromise.then(itemMap => {
            window.didInitialInventoryUpdate = true;
            window.guildId = data?.GuildId?.$oid;

            const modularWeapons = [
                "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimary",
                "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryBeam",
                "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryLauncher",
                "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryShotgun",
                "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimarySniper",
                "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondary",
                "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondaryBeam",
                "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondaryShotgun",
                "/Lotus/Weapons/Ostron/Melee/LotusModularWeapon",
                "/Lotus/Weapons/Sentients/OperatorAmplifiers/OperatorAmpWeapon",
                "/Lotus/Types/Vehicles/Hoverboard/HoverboardSuit",
                "/Lotus/Types/Friendly/Pets/MoaPets/MoaPetPowerSuit",
                "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetAPowerSuit",
                "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetBPowerSuit",
                "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetCPowerSuit",
                "/Lotus/Types/Friendly/Pets/CreaturePets/VulpineInfestedCatbrowPetPowerSuit",
                "/Lotus/Types/Friendly/Pets/CreaturePets/HornedInfestedCatbrowPetPowerSuit",
                "/Lotus/Types/Friendly/Pets/CreaturePets/ArmoredInfestedCatbrowPetPowerSuit",
                "/Lotus/Types/Friendly/Pets/CreaturePets/VizierPredatorKubrowPetPowerSuit",
                "/Lotus/Types/Friendly/Pets/CreaturePets/PharaohPredatorKubrowPetPowerSuit",
                "/Lotus/Types/Friendly/Pets/CreaturePets/MedjayPredatorKubrowPetPowerSuit"
            ];

            // Populate inventory route

            document.getElementById("typeName-tab").classList.remove("active");
            document.getElementById("typeName-tab-content").classList.remove("active", "show");
            document.getElementById("typeName-type").value = "";

            document.getElementById("miscItems-tab").classList.add("active");
            document.getElementById("miscItems-tab-content").classList.add("active", "show");

            ["RegularCredits", "PremiumCredits", "FusionPoints", "PrimeTokens"].forEach(currency => {
                document.getElementById(currency + "-owned").textContent = loc("currency_owned")
                    .split("|COUNT|")
                    .join(data[currency].toLocaleString());
            });

            [
                "Suits",
                "SpaceSuits",
                "Sentinels",
                "LongGuns",
                "Pistols",
                "Melee",
                "SpaceGuns",
                "SpaceMelee",
                "SentinelWeapons",
                "Hoverboards",
                "OperatorAmps",
                "MechSuits",
                "MoaPets",
                "KubrowPets"
            ].forEach(category => {
                document.getElementById(category + "-list").innerHTML = "";
                data[category]
                    .sort((a, b) => (b.Favorite ? 1 : 0) - (a.Favorite ? 1 : 0))
                    .forEach(item => {
                        const tr = document.createElement("tr");
                        tr.setAttribute("data-item-type", item.ItemType);
                        {
                            const td = document.createElement("td");
                            td.textContent = itemMap[item.ItemType]?.name ?? item.ItemType;
                            if (item.ItemName) {
                                const pipeIndex = item.ItemName.indexOf("|");
                                if (pipeIndex != -1) {
                                    td.textContent = item.ItemName.substr(1 + pipeIndex) + " " + td.textContent;
                                } else {
                                    td.textContent = item.ItemName + " (" + td.textContent + ")";
                                }
                            }
                            if (item.Details?.Name) {
                                td.textContent = item.Details.Name + " (" + td.textContent + ")";
                            }
                            if (item.ModularParts && item.ModularParts.length) {
                                td.textContent += " [";
                                item.ModularParts.forEach(part => {
                                    td.textContent += " " + (itemMap[part]?.name ?? part) + ",";
                                });
                                td.textContent = td.textContent.slice(0, -1) + " ]";
                            }
                            tr.appendChild(td);
                        }
                        {
                            const td = document.createElement("td");
                            td.classList = "text-end text-nowrap";

                            let maxXP = Math.pow(itemMap[item.ItemType]?.maxLevelCap ?? 30, 2) * 1000;
                            if (
                                category != "Suits" &&
                                category != "SpaceSuits" &&
                                category != "Sentinels" &&
                                category != "Hoverboards" &&
                                category != "MechSuits" &&
                                category != "MoaPets" &&
                                category != "KubrowPets"
                            ) {
                                maxXP /= 2;
                            }
                            let anyExaltedMissingXP = false;
                            if (item.XP >= maxXP && item.ItemType in itemMap && "exalted" in itemMap[item.ItemType]) {
                                for (const exaltedType of itemMap[item.ItemType].exalted) {
                                    const exaltedItem = data.SpecialItems.find(x => x.ItemType == exaltedType);
                                    if (exaltedItem) {
                                        const exaltedCap =
                                            itemMap[exaltedType]?.type == "weapons" ? 800_000 : 1_600_000;
                                        if (exaltedItem.XP < exaltedCap) {
                                            anyExaltedMissingXP = true;
                                            break;
                                        }
                                    }
                                }
                            }
                            if (
                                itemMap[item.ItemType]?.maxLevelCap > 30 &&
                                (item.Polarized ?? 0) < (itemMap[item.ItemType].maxLevelCap - 30) / 2
                            ) {
                                const a = document.createElement("a");
                                a.href = "#";
                                a.onclick = function (event) {
                                    event.preventDefault();
                                    unlockLevelCap(
                                        category,
                                        item.ItemId.$oid,
                                        (itemMap[item.ItemType].maxLevelCap - 30) / 2
                                    );
                                };
                                a.title = loc("code_unlockLevelCap");
                                a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--!Font Awesome Free v7.0.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M48 195.8l209.2 86.1c9.8 4 20.2 6.1 30.8 6.1s21-2.1 30.8-6.1l242.4-99.8c9-3.7 14.8-12.4 14.8-22.1s-5.8-18.4-14.8-22.1L318.8 38.1C309 34.1 298.6 32 288 32s-21 2.1-30.8 6.1L14.8 137.9C5.8 141.6 0 150.3 0 160L0 456c0 13.3 10.7 24 24 24s24-10.7 24-24l0-260.2zm48 71.7L96 384c0 53 86 96 192 96s192-43 192-96l0-116.6-142.9 58.9c-15.6 6.4-32.2 9.7-49.1 9.7s-33.5-3.3-49.1-9.7L96 267.4z"/></svg>`;
                                td.appendChild(a);
                            }
                            if (item.XP < maxXP || anyExaltedMissingXP) {
                                const a = document.createElement("a");
                                a.href = "#";
                                a.onclick = function (event) {
                                    event.preventDefault();
                                    revalidateAuthz().then(async () => {
                                        if (item.XP < maxXP) {
                                            await addGearExp(category, item.ItemId.$oid, maxXP - item.XP);
                                        }
                                        if ("exalted" in itemMap[item.ItemType]) {
                                            for (const exaltedType of itemMap[item.ItemType].exalted) {
                                                const exaltedItem = data.SpecialItems.find(
                                                    x => x.ItemType == exaltedType
                                                );
                                                if (exaltedItem) {
                                                    const exaltedCap =
                                                        itemMap[exaltedType]?.type == "weapons" ? 800_000 : 1_600_000;
                                                    if (exaltedItem.XP < exaltedCap) {
                                                        await addGearExp(
                                                            "SpecialItems",
                                                            exaltedItem.ItemId.$oid,
                                                            exaltedCap - exaltedItem.XP
                                                        );
                                                    }
                                                }
                                            }
                                        }
                                        updateInventory();
                                    });
                                };
                                a.title = loc("code_maxRank");
                                a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"/></svg>`;
                                td.appendChild(a);
                            }

                            {
                                const a = document.createElement("a");
                                a.href =
                                    "/webui/detailedView?productCategory=" + category + "&itemId=" + item.ItemId.$oid;
                                a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M278.5 215.6L23 471c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l57-57h68c49.7 0 97.9-14.4 139-41c11.1-7.2 5.5-23-7.8-23c-5.1 0-9.2-4.1-9.2-9.2c0-4.1 2.7-7.6 6.5-8.8l81-24.3c2.5-.8 4.8-2.1 6.7-4l22.4-22.4c10.1-10.1 2.9-27.3-11.3-27.3l-32.2 0c-5.1 0-9.2-4.1-9.2-9.2c0-4.1 2.7-7.6 6.5-8.8l112-33.6c4-1.2 7.4-3.9 9.3-7.7C506.4 207.6 512 184.1 512 160c0-41-16.3-80.3-45.3-109.3l-5.5-5.5C432.3 16.3 393 0 352 0s-80.3 16.3-109.3 45.3L139 149C91 197 64 262.1 64 330v55.3L253.6 195.8c6.2-6.2 16.4-6.2 22.6 0c5.4 5.4 6.1 13.6 2.2 19.8z"/></svg>`;
                                td.appendChild(a);
                            }

                            if (!(item.Features & 8) && modularWeapons.includes(item.ItemType)) {
                                const a = document.createElement("a");
                                a.href = "#";
                                a.onclick = function (event) {
                                    event.preventDefault();
                                    equipmentFeatures(category, item.ItemId.$oid, 8);
                                };
                                a.title = loc("code_gild");
                                a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></svg>`;
                                td.appendChild(a);
                            }
                            if (category == "KubrowPets") {
                                const a = document.createElement("a");
                                a.href = "#";
                                a.onclick = function (event) {
                                    event.preventDefault();
                                    maturePet(item.ItemId.$oid, !item.Details.IsPuppy);
                                };
                                if (item.Details.IsPuppy) {
                                    a.title = loc("code_mature");
                                    a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M112 48a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm40 304l0 128c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-223.1L59.4 304.5c-9.1 15.1-28.8 20-43.9 10.9s-20-28.8-10.9-43.9l58.3-97c17.4-28.9 48.6-46.6 82.3-46.6l29.7 0c33.7 0 64.9 17.7 82.3 46.6l58.3 97c9.1 15.1 4.2 34.8-10.9 43.9s-34.8 4.2-43.9-10.9L232 256.9 232 480c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-128-16 0z"/></svg>`;
                                } else {
                                    a.title = loc("code_unmature");
                                    a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M256 64A64 64 0 1 0 128 64a64 64 0 1 0 128 0zM152.9 169.3c-23.7-8.4-44.5-24.3-58.8-45.8L74.6 94.2C64.8 79.5 45 75.6 30.2 85.4s-18.7 29.7-8.9 44.4L40.9 159c18.1 27.1 42.8 48.4 71.1 62.4L112 480c0 17.7 14.3 32 32 32s32-14.3 32-32l0-96 32 0 0 96c0 17.7 14.3 32 32 32s32-14.3 32-32l0-258.4c29.1-14.2 54.4-36.2 72.7-64.2l18.2-27.9c9.6-14.8 5.4-34.6-9.4-44.3s-34.6-5.5-44.3 9.4L291 122.4c-21.8 33.4-58.9 53.6-98.8 53.6c-12.6 0-24.9-2-36.6-5.8c-.9-.3-1.8-.7-2.7-.9z"/></svg>`;
                                }
                                td.appendChild(a);
                            }
                            {
                                const a = document.createElement("a");
                                a.href = "#";
                                a.onclick = function (event) {
                                    event.preventDefault();
                                    const name = prompt(loc("code_renamePrompt"));
                                    if (name !== null) {
                                        renameGear(category, item.ItemId.$oid, name);
                                    }
                                };
                                a.title = loc("code_rename");
                                a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M0 80V229.5c0 17 6.7 33.3 18.7 45.3l176 176c25 25 65.5 25 90.5 0L418.7 317.3c25-25 25-65.5 0-90.5l-176-176c-12-12-28.3-18.7-45.3-18.7H48C21.5 32 0 53.5 0 80zm112 32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg>`;
                                td.appendChild(a);
                            }
                            {
                                const a = document.createElement("a");
                                a.href = "#";
                                a.onclick = function (event) {
                                    event.preventDefault();
                                    document.getElementById(category + "-list").removeChild(tr);
                                    disposeOfGear(category, item.ItemId.$oid);
                                };
                                a.title = loc("code_remove");
                                a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>`;
                                td.appendChild(a);
                            }
                            tr.appendChild(td);
                        }
                        document.getElementById(category + "-list").appendChild(tr);
                    });
            });

            document.getElementById("EvolutionProgress-list").innerHTML = "";
            data.EvolutionProgress?.forEach(item => {
                const tr = document.createElement("tr");
                tr.setAttribute("data-item-type", item.ItemType);
                {
                    const td = document.createElement("td");
                    td.textContent = itemMap[item.ItemType]?.name ?? item.ItemType;
                    if (item.Rank != null) {
                        td.textContent += " | " + loc("code_rank") + ": [" + item.Rank + "/5]";
                    }
                    tr.appendChild(td);
                }
                {
                    const td = document.createElement("td");
                    td.classList = "text-end text-nowrap";
                    if (item.Rank < 5) {
                        const a = document.createElement("a");
                        a.href = "#";
                        a.onclick = function (event) {
                            event.preventDefault();
                            setEvolutionProgress([{ ItemType: item.ItemType, Rank: 5 }]);
                        };
                        a.title = loc("code_maxRank");
                        a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"/></svg>`;

                        td.appendChild(a);
                    }
                    if ((permanentEvolutionWeapons.has(item.ItemType) && item.Rank > 0) || item.Rank > 1) {
                        const a = document.createElement("a");
                        a.href = "#";
                        a.onclick = function (event) {
                            event.preventDefault();
                            setEvolutionProgress([{ ItemType: item.ItemType, Rank: item.Rank - 1 }]);
                        };
                        a.title = loc("code_rankDown");
                        a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg>`;

                        td.appendChild(a);
                    }
                    if (item.Rank < 5) {
                        const a = document.createElement("a");
                        a.href = "#";
                        a.onclick = function (event) {
                            event.preventDefault();
                            setEvolutionProgress([{ ItemType: item.ItemType, Rank: item.Rank + 1 }]);
                        };
                        a.title = loc("code_rankUp");
                        a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"/></svg>`;

                        td.appendChild(a);
                    }

                    tr.appendChild(td);
                }

                document.getElementById("EvolutionProgress-list").appendChild(tr);
            });

            document.getElementById("Boosters-list").innerHTML = "";
            data.Boosters.forEach(item => {
                if (item.ExpiryDate < Math.floor(Date.now() / 1000)) {
                    // Booster has expired, skip it
                    return;
                }
                const tr = document.createElement("tr");
                {
                    const td = document.createElement("td");
                    td.textContent = itemMap[item.ItemType]?.name ?? item.ItemType;
                    tr.appendChild(td);
                    if (item.ItemType == "/Lotus/Types/Boosters/ReviveBooster") {
                        td.textContent += " ";
                        const abbr = document.createElement("abbr");
                        abbr.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM320 200C333.3 200 344 210.7 344 224L344 336C344 349.3 333.3 360 320 360C306.7 360 296 349.3 296 336L296 224C296 210.7 306.7 200 320 200zM293.3 416C292.7 406.1 297.6 396.7 306.1 391.5C314.6 386.4 325.3 386.4 333.8 391.5C342.3 396.7 347.2 406.1 346.6 416C347.2 425.9 342.3 435.3 333.8 440.5C325.3 445.6 314.6 445.6 306.1 440.5C297.6 435.3 292.7 425.9 293.3 416z"/></svg>`;
                        abbr.title = loc("code_reviveBoosterDesc");
                        td.appendChild(abbr);
                    }
                }
                {
                    const td = document.createElement("td");
                    td.classList = "text-end text-nowrap";
                    {
                        const form = document.createElement("form");
                        form.style.display = "inline-block";
                        form.onsubmit = function (event) {
                            event.preventDefault();
                            const maxDate = new Date(input.max);
                            const selectedDate = new Date(input.value);
                            if (selectedDate > maxDate) {
                                input.value = maxDate.toISOString().slice(0, 16);
                            }
                            doChangeBoosterExpiry(item.ItemType, input);
                        };

                        const input = document.createElement("input");
                        input.type = "datetime-local";
                        input.classList = "form-control form-control-sm";
                        input.value = formatDatetime("%Y-%m-%d %H:%M:%s", item.ExpiryDate * 1000);
                        input.max = "2038-01-19T03:14";
                        input.onblur = function () {
                            const maxDate = new Date(input.max);
                            const selectedDate = new Date(input.value);
                            if (selectedDate > maxDate) {
                                input.value = maxDate.toISOString().slice(0, 16);
                            }
                            doChangeBoosterExpiry(item.ItemType, input);
                        };

                        form.appendChild(input);
                        td.appendChild(form);
                    }
                    {
                        const a = document.createElement("a");
                        a.href = "#";
                        a.onclick = function (event) {
                            event.preventDefault();
                            setBooster(item.ItemType, 0);
                        };
                        a.title = loc("code_remove");
                        a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>`;
                        td.appendChild(a);
                    }
                    tr.appendChild(td);
                }
                document.getElementById("Boosters-list").appendChild(tr);
            });

            document.getElementById("FlavourItems-list").innerHTML = "";
            data.FlavourItems.forEach(item => {
                const tr = document.createElement("tr");
                tr.setAttribute("data-item-type", item.ItemType);
                {
                    const td = document.createElement("td");
                    td.textContent = itemMap[item.ItemType]?.name ?? item.ItemType;
                    tr.appendChild(td);
                }
                {
                    const td = document.createElement("td");
                    td.classList = "text-end text-nowrap";

                    {
                        const a = document.createElement("a");
                        a.href = "#";
                        a.onclick = function (event) {
                            event.preventDefault();
                            removeCustomization(item.ItemType);
                        };
                        a.title = loc("code_remove");
                        a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>`;
                        td.appendChild(a);
                    }
                    tr.appendChild(td);
                }

                document.getElementById("FlavourItems-list").appendChild(tr);
            });

            document.getElementById("WeaponSkins-list").innerHTML = "";
            data.WeaponSkins.forEach(item => {
                if (item.ItemId.$oid.startsWith("ca70ca70ca70ca70")) return;
                const tr = document.createElement("tr");
                {
                    const td = document.createElement("td");
                    const name = itemMap[item.ItemType]?.name?.trim();
                    td.textContent = name || item.ItemType;
                    tr.appendChild(td);
                }
                {
                    const td = document.createElement("td");
                    td.classList = "text-end text-nowrap";
                    {
                        const a = document.createElement("a");
                        a.href = "#";
                        a.onclick = function (event) {
                            event.preventDefault();
                            document.getElementById("WeaponSkins-list").removeChild(tr);
                            disposeOfGear("WeaponSkins", item.ItemId.$oid);
                        };
                        a.title = loc("code_remove");
                        a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>`;
                        td.appendChild(a);
                    }

                    tr.appendChild(td);
                }

                document.getElementById("WeaponSkins-list").appendChild(tr);
            });

            if (data.CrewShipHarnesses?.length) {
                window.plexus = {
                    id: data.CrewShipHarnesses[0].ItemId.$oid,
                    xp: data.CrewShipHarnesses[0].XP
                };
            }

            document.getElementById("ShipDecorations-list").innerHTML = "";
            data.ShipDecorations.forEach(item => {
                if (item.ItemCount > 0) {
                    const tr = document.createElement("tr");
                    tr.setAttribute("data-item-type", item.ItemType);
                    {
                        const td = document.createElement("td");
                        td.textContent = itemMap[item.ItemType]?.name ?? item.ItemType;
                        if (item.ItemCount > 1) {
                            td.innerHTML +=
                                " <span title='" + loc("code_count") + "'>🗍 " + parseInt(item.ItemCount) + "</span>";
                        }
                        tr.appendChild(td);
                    }
                    {
                        const td = document.createElement("td");
                        td.classList = "text-end text-nowrap";
                        {
                            const a = document.createElement("a");
                            a.href = "#";
                            a.onclick = function (event) {
                                event.preventDefault();
                                removeCountItems(item.ItemType, item.ItemCount);
                            };
                            a.title = loc("code_remove");
                            a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>`;
                            td.appendChild(a);
                        }
                        tr.appendChild(td);
                    }
                    document.getElementById("ShipDecorations-list").appendChild(tr);
                }
            });

            // Populate quests route
            document.getElementById("QuestKeys-list").innerHTML = "";
            data.QuestKeys.forEach(item => {
                const tr = document.createElement("tr");
                tr.setAttribute("data-item-type", item.ItemType);
                const run = item.Progress[0]?.c ?? 0;
                const stage = run == 0 ? item.Progress.length : item.Progress.map(p => p.c ?? 0).lastIndexOf(run);

                {
                    const td = document.createElement("td");
                    td.textContent = itemMap[item.ItemType]?.name ?? item.ItemType;
                    if (!item.Completed) {
                        td.textContent +=
                            " | " + loc("code_stage") + ": [" + stage + "/" + itemMap[item.ItemType]?.chainLength + "]";
                    } else {
                        td.textContent += " | " + loc("code_completed");
                    }

                    if (run > 0) {
                        td.textContent += " | " + loc("code_replays") + ": " + (run + 1);
                    }

                    if (data.ActiveQuest == item.ItemType) td.textContent += " | " + loc("code_active");
                    tr.appendChild(td);
                }
                {
                    const td = document.createElement("td");
                    td.classList = "text-end text-nowrap";
                    if (data.ActiveQuest == item.ItemType && !item.Completed) {
                        console.log(data.ActiveQuest);

                        const a = document.createElement("a");
                        a.href = "#";
                        a.onclick = function (event) {
                            event.preventDefault();
                            debounce(doQuestUpdate, "setInactive", item.ItemType);
                        };
                        a.title = loc("code_setInactive");
                        a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm192-96l128 0c17.7 0 32 14.3 32 32l0 128c0 17.7-14.3 32-32 32l-128 0c-17.7 0-32-14.3-32-32l0-128c0-17.7 14.3-32 32-32z"/></svg>`;
                        td.appendChild(a);
                    }
                    if (stage > 0) {
                        const a = document.createElement("a");
                        a.href = "#";
                        a.onclick = function (event) {
                            event.preventDefault();
                            debounce(doQuestUpdate, "resetKey", item.ItemType);
                        };
                        a.title = loc("code_reset");
                        a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M463.5 224l8.5 0c13.3 0 24-10.7 24-24l0-128c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1c-87.5 87.5-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8l119.5 0z"/></svg>`;
                        td.appendChild(a);
                    }
                    if (itemMap[item.ItemType]?.chainLength > stage && !item.Completed) {
                        const a = document.createElement("a");
                        a.href = "#";
                        a.onclick = function (event) {
                            event.preventDefault();
                            debounce(doQuestUpdate, "completeKey", item.ItemType);
                        };
                        a.title = loc("code_complete");
                        a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>`;
                        td.appendChild(a);
                    }
                    if (stage > 0 && itemMap[item.ItemType]?.chainLength > 1) {
                        const a = document.createElement("a");
                        a.href = "#";
                        a.onclick = function (event) {
                            event.preventDefault();
                            debounce(doQuestUpdate, "prevStage", item.ItemType);
                        };
                        a.title = loc("code_prevStage");
                        a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 256 246.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"/></svg>`;
                        td.appendChild(a);
                    }
                    if (
                        itemMap[item.ItemType]?.chainLength > stage &&
                        !item.Completed &&
                        itemMap[item.ItemType]?.chainLength > 1
                    ) {
                        const a = document.createElement("a");
                        a.href = "#";
                        a.onclick = function (event) {
                            event.preventDefault();
                            debounce(doQuestUpdate, "nextStage", item.ItemType);
                        };
                        a.title = loc("code_nextStage");
                        a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"/></svg>`;
                        td.appendChild(a);
                    }
                    {
                        const a = document.createElement("a");
                        a.href = "#";
                        a.onclick = function (event) {
                            event.preventDefault();
                            debounce(doQuestUpdate, "deleteKey", item.ItemType);
                        };
                        a.title = loc("code_remove");
                        a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>`;
                        td.appendChild(a);
                    }
                    tr.appendChild(td);
                }
                document.getElementById("QuestKeys-list").appendChild(tr);
            });

            // Populate mods route
            document.getElementById("riven-list").innerHTML = "";
            document.getElementById("mods-list").innerHTML = "";
            data.Upgrades.forEach(item => {
                if (item.ItemType.substr(0, 32) == "/Lotus/Upgrades/Mods/Randomized/") {
                    const rivenType = item.ItemType.substr(32);
                    const fingerprint = JSON.parse(item.UpgradeFingerprint);
                    if ("buffs" in fingerprint) {
                        // Riven has been revealed?
                        const tr = document.createElement("tr");
                        {
                            const td = document.createElement("td");
                            td.textContent = itemMap[fingerprint.compat]?.name ?? fingerprint.compat;
                            td.textContent += " ";
                            try {
                                td.textContent += RivenParser.parseRiven(rivenType, fingerprint, 1).name;
                            } catch (e) {
                                console.warn("malformed riven", { rivenType, fingerprint });
                                td.textContent += " [Malformed Riven]";
                            }
                            td.innerHTML +=
                                " <span title='" +
                                loc("code_buffsNumber") +
                                "'>▲ " +
                                fingerprint.buffs.length +
                                "</span>";
                            td.innerHTML +=
                                " <span title='" +
                                loc("code_cursesNumber") +
                                "'>▼ " +
                                fingerprint.curses.length +
                                "</span>";
                            td.innerHTML +=
                                " <span title='" +
                                loc("code_rerollsNumber") +
                                "'>⟳ " +
                                (fingerprint.rerolls ?? 0) +
                                "</span>";
                            tr.appendChild(td);
                        }
                        {
                            const td = document.createElement("td");
                            td.classList = "text-end text-nowrap";
                            {
                                const a = document.createElement("a");
                                a.href =
                                    "riven-tool/#" +
                                    encodeURIComponent(
                                        JSON.stringify({
                                            rivenType: rivenType,
                                            omegaAttenuation: 1,
                                            fingerprint: fingerprint
                                        })
                                    );
                                a.target = "_blank";
                                a.title = loc("code_viewStats");
                                a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M160 80c0-26.5 21.5-48 48-48h32c26.5 0 48 21.5 48 48V432c0 26.5-21.5 48-48 48H208c-26.5 0-48-21.5-48-48V80zM0 272c0-26.5 21.5-48 48-48H80c26.5 0 48 21.5 48 48V432c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V272zM368 96h32c26.5 0 48 21.5 48 48V432c0 26.5-21.5 48-48 48H368c-26.5 0-48-21.5-48-48V144c0-26.5 21.5-48 48-48z"/></svg>`;
                                td.appendChild(a);
                            }
                            {
                                const a = document.createElement("a");
                                a.href = "#";
                                a.onclick = function (event) {
                                    event.preventDefault();
                                    document.getElementById("riven-list").removeChild(tr);
                                    disposeOfGear("Upgrades", item.ItemId.$oid);
                                };
                                a.title = loc("code_remove");
                                a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>`;
                                td.appendChild(a);
                            }
                            tr.appendChild(td);
                        }
                        document.getElementById("riven-list").appendChild(tr);
                        return;
                    }
                }
                const tr = document.createElement("tr");
                const rank = parseInt(JSON.parse(item.UpgradeFingerprint).lvl);
                const maxRank = itemMap[item.ItemType]?.fusionLimit ?? 5;
                {
                    const td = document.createElement("td");
                    td.textContent = itemMap[item.ItemType]?.name ?? item.ItemType;
                    if (itemMap[item.ItemType]?.badReason == "notraw") {
                        // Assuming this is a riven with a pending challenge, so rank would be N/A, but otherwise it's fine.
                    } else {
                        td.innerHTML += " <span title='" + loc("code_rank") + "'>★ " + rank + "/" + maxRank + "</span>";
                    }
                    tr.appendChild(td);
                }
                {
                    const td = document.createElement("td");
                    td.classList = "text-end text-nowrap";
                    if (rank < maxRank) {
                        const a = document.createElement("a");
                        a.href = "#";
                        a.onclick = function (event) {
                            event.preventDefault();
                            setFingerprint(item.ItemType, item.ItemId, { lvl: maxRank });
                        };
                        a.title = loc("code_maxRank");
                        a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"/></svg>`;
                        td.appendChild(a);
                    }
                    {
                        const a = document.createElement("a");
                        a.href = "#";
                        a.onclick = function (event) {
                            event.preventDefault();
                            document.getElementById("mods-list").removeChild(tr);
                            disposeOfGear("Upgrades", item.ItemId.$oid);
                        };
                        a.title = loc("code_remove");
                        a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>`;
                        td.appendChild(a);
                    }
                    tr.appendChild(td);
                }
                document.getElementById("mods-list").appendChild(tr);
            });
            data.RawUpgrades.forEach(item => {
                if (item.ItemCount > 0) {
                    const maxRank = itemMap[item.ItemType]?.fusionLimit ?? 5;
                    const tr = document.createElement("tr");
                    {
                        const td = document.createElement("td");
                        td.textContent = itemMap[item.ItemType]?.name ?? item.ItemType;
                        if (maxRank > 0) {
                            td.innerHTML += " <span title='" + loc("code_rank") + "'>★ 0/" + maxRank + "</span>";
                        }
                        if (item.ItemCount > 1) {
                            td.innerHTML +=
                                " <span title='" + loc("code_count") + "'>🗍 " + parseInt(item.ItemCount) + "</span>";
                        }
                        tr.appendChild(td);
                    }
                    {
                        const td = document.createElement("td");
                        td.classList = "text-end text-nowrap";
                        if (maxRank != 0) {
                            const a = document.createElement("a");
                            a.href = "#";
                            a.onclick = function (event) {
                                event.preventDefault();
                                setFingerprint(item.ItemType, item.LastAdded, { lvl: maxRank });
                            };
                            a.title = loc("code_maxRank");
                            a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"/></svg>`;
                            td.appendChild(a);
                        }
                        {
                            const a = document.createElement("a");
                            a.href = "#";
                            a.onclick = function (event) {
                                event.preventDefault();
                                document.getElementById("mods-list").removeChild(tr);
                                disposeOfItems("Upgrades", item.ItemType, item.ItemCount);
                            };
                            a.title = loc("code_remove");
                            a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>`;
                            td.appendChild(a);
                        }
                        tr.appendChild(td);
                    }
                    document.getElementById("mods-list").appendChild(tr);
                }
            });

            // Populate detailedView route
            if (single.getCurrentPath().substr(0, 19) == "/webui/detailedView") {
                const urlParams = new URLSearchParams(window.location.search);
                const oid = urlParams.get("itemId");
                const category = urlParams.get("productCategory");
                const item = data[category].find(x => x.ItemId.$oid == oid);

                if (item) {
                    document.getElementById("detailedView-loading").classList.add("d-none");
                    const itemName = itemMap[item.ItemType]?.name ?? item.ItemType;
                    if (item.ItemName) {
                        const pipeIndex = item.ItemName.indexOf("|");
                        if (pipeIndex != -1) {
                            $("#detailedView-title").text(item.ItemName.substr(1 + pipeIndex) + " " + itemName);
                        } else {
                            $("#detailedView-title").text(item.ItemName);
                            $("#detailedView-route .text-body-secondary").text(itemName);
                        }
                    } else {
                        $("#detailedView-title").text(itemName);
                    }

                    {
                        document.getElementById("equipmentFeatures-card").classList.remove("d-none");
                        const buttonsCard = document.getElementById("equipmentFeaturesButtons-card");
                        buttonsCard.innerHTML = "";
                        item.Features ??= 0;
                        const bits = [];
                        if (category != "OperatorAmps") bits.push(1);
                        if (["Suits", "LongGuns", "Pistols", "Melee"].includes(category)) bits.push(2);
                        if (modularWeapons.includes(item.ItemType)) bits.push(8);
                        if (["LongGuns", "Pistols", "Melee", "SpaceGuns", "OperatorAmps"].includes(category))
                            bits.push(32);
                        if (category == "SpaceGuns") bits.push(4, 64);
                        if (
                            ["LongGuns", "Pistols", "Melee", "SpaceGuns", "SpaceMelee"].includes(category) &&
                            item.UpgradeFingerprint
                        )
                            bits.push(1024);
                        for (const bit of bits.sort((a, b) => a - b)) {
                            const wrapper = document.createElement("div");
                            wrapper.classList = "form-check";

                            const input = document.createElement("input");
                            input.classList = "form-check-input";
                            input.type = "checkbox";
                            input.id = `detailedView-feature-${bit}`;
                            input.checked = item.Features & bit;

                            const label = document.createElement("label");
                            label.classList = "form-check-label";
                            label.htmlFor = input.id;
                            let locString = `code_feature_${bit}`;
                            if (
                                ![
                                    "Suits",
                                    "SpaceSuits",
                                    "Hoverboards",
                                    "MechSuits",
                                    "Sentinels",
                                    "MoaPets",
                                    "KubrowPets"
                                ].includes(category) &&
                                bit === 1
                            ) {
                                locString = `code_feature_${bit}_alt`;
                            }
                            label.innerHTML = loc(locString);
                            label.setAttribute("data-loc", locString);

                            input.onchange = function (event) {
                                event.preventDefault();
                                equipmentFeatures(category, oid, bit);
                            };
                            if (
                                (data.unlockDoubleCapacityPotatoesEverywhere && bit === 1) ||
                                (data.unlockExilusEverywhere && bit === 2) ||
                                (data.unlockArcanesEverywhere && (bit === 32 || bit === 64))
                            ) {
                                input.disabled = true;
                            }

                            wrapper.appendChild(input);
                            wrapper.appendChild(label);
                            buttonsCard.appendChild(wrapper);
                        }
                    }

                    if (category == "Suits") {
                        document.getElementById("archonShards-card").classList.remove("d-none");

                        const uniqueUpgrades = {};
                        (item.ArchonCrystalUpgrades ?? []).forEach(upgrade => {
                            if (upgrade && upgrade.UpgradeType) {
                                uniqueUpgrades[upgrade.UpgradeType] ??= 0;
                                uniqueUpgrades[upgrade.UpgradeType] += 1;
                            }
                        });

                        document.getElementById("crystals-list").innerHTML = "";
                        Object.entries(uniqueUpgrades).forEach(([upgradeType, count]) => {
                            const tr = document.createElement("tr");
                            {
                                const td = document.createElement("td");
                                td.textContent = count + "x " + (archonCrystalUpgrades[upgradeType] ?? upgradeType);
                                tr.appendChild(td);
                            }
                            {
                                const td = document.createElement("td");
                                td.classList = "text-end text-nowrap";
                                {
                                    const a = document.createElement("a");
                                    a.href = "#";
                                    a.onclick = function (event) {
                                        event.preventDefault();
                                        doPopArchonCrystalUpgrade(upgradeType);
                                    };
                                    a.title = loc("code_remove");
                                    a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>`;
                                    td.appendChild(a);
                                }
                                tr.appendChild(td);
                            }
                            document.getElementById("crystals-list").appendChild(tr);
                        });

                        {
                            document.getElementById("edit-suit-invigorations-card").classList.remove("d-none");
                            document.getElementById("invigoration-offensive").value = item.OffensiveUpgrade || "";
                            document.getElementById("invigoration-defensive").value = item.DefensiveUpgrade || "";
                            document.getElementById("invigoration-expiry").value =
                                formatDatetime("%Y-%m-%d %H:%M", Number(item.UpgradesExpiry?.$date.$numberLong)) || "";
                        }

                        if (item.ItemType != "/Lotus/Powersuits/Excalibur/ExcaliburUmbra") {
                            document.getElementById("umbraEchoes-card").classList.remove("d-none");
                            document.getElementById("umbraEchoes-expiry").value =
                                formatDatetime("%Y-%m-%d %H:%M", Number(item.UmbraDate?.$date.$numberLong)) || "";
                        }

                        {
                            document.getElementById("loadout-card").classList.remove("d-none");
                            const maxModConfigNum = Math.min(2 + (item.ModSlotPurchases ?? 0), 5);

                            const configs = item.Configs ?? [];

                            const loadoutTabs = document.getElementById("loadoutTabs");
                            const loadoutTabsContent = document.getElementById("loadoutTabsContent");
                            loadoutTabs.innerHTML = "";
                            loadoutTabsContent.innerHTML = "";
                            for (let i = 0; i <= maxModConfigNum; i++) {
                                const config = configs[i] ?? {};

                                {
                                    const li = document.createElement("li");
                                    li.classList.add("nav-item");

                                    const button = document.createElement("button");
                                    button.classList.add("nav-link");
                                    if (i === 0) button.classList.add("active");
                                    button.id = `config${i}-tab`;
                                    button.setAttribute("data-bs-toggle", "tab");
                                    button.setAttribute("data-bs-target", `#config${i}`);
                                    button.innerHTML = config.Name?.trim() || String.fromCharCode(65 + i);

                                    li.appendChild(button);
                                    loadoutTabs.appendChild(li);
                                }

                                {
                                    const tabDiv = document.createElement("div");
                                    tabDiv.classList = "tab-pane";
                                    if (i === 0) tabDiv.classList.add("show", "active");

                                    tabDiv.id = `config${i}`;

                                    {
                                        const abilityOverrideForm = document.createElement("form");
                                        abilityOverrideForm.classList = "form-group mt-2";
                                        abilityOverrideForm.setAttribute(
                                            "onsubmit",
                                            `handleAbilityOverride(event, ${i});return false;`
                                        );

                                        const abilityOverrideFormLabel = document.createElement("label");
                                        abilityOverrideFormLabel.setAttribute("data-loc", "abilityOverride_label");
                                        abilityOverrideFormLabel.innerHTML = loc("abilityOverride_label");
                                        abilityOverrideFormLabel.classList = "form-label";
                                        abilityOverrideFormLabel.setAttribute(
                                            "for",
                                            `abilityOverride-ability-config-${i}`
                                        );
                                        abilityOverrideForm.appendChild(abilityOverrideFormLabel);

                                        const abilityOverrideInputGroup = document.createElement("div");
                                        abilityOverrideInputGroup.classList = "input-group";
                                        abilityOverrideForm.appendChild(abilityOverrideInputGroup);

                                        const abilityOverrideInput = document.createElement("input");
                                        abilityOverrideInput.id = `abilityOverride-ability-config-${i}`;
                                        abilityOverrideInput.classList = "form-control";
                                        abilityOverrideInput.setAttribute("list", "datalist-Abilities");
                                        if (config.AbilityOverride) {
                                            const datalist = document.getElementById("datalist-Abilities");
                                            const options = Array.from(datalist.options);
                                            abilityOverrideInput.value = options.find(
                                                option =>
                                                    config.AbilityOverride.Ability == option.getAttribute("data-key")
                                            ).value;
                                        }
                                        abilityOverrideInputGroup.appendChild(abilityOverrideInput);

                                        const abilityOverrideOnSlot = document.createElement("span");
                                        abilityOverrideOnSlot.classList = "input-group-text";
                                        abilityOverrideOnSlot.setAttribute("data-loc", "abilityOverride_onSlot");
                                        abilityOverrideOnSlot.innerHTML = loc("abilityOverride_onSlot");
                                        abilityOverrideInputGroup.appendChild(abilityOverrideOnSlot);

                                        const abilityOverrideSecondInput = document.createElement("input");
                                        abilityOverrideSecondInput.id = `abilityOverride-ability-index-config-${i}`;
                                        abilityOverrideSecondInput.classList = "form-control";
                                        abilityOverrideSecondInput.setAttribute("type", "number");
                                        abilityOverrideSecondInput.setAttribute("min", "0");
                                        abilityOverrideSecondInput.setAttribute("max", "3");
                                        if (config.AbilityOverride)
                                            abilityOverrideSecondInput.value = config.AbilityOverride.Index;
                                        abilityOverrideInputGroup.appendChild(abilityOverrideSecondInput);

                                        const abilityOverrideSetButton = document.createElement("button");
                                        abilityOverrideSetButton.classList = "btn btn-primary";
                                        abilityOverrideSetButton.setAttribute("type", "submit");
                                        abilityOverrideSetButton.setAttribute("value", "set");
                                        abilityOverrideSetButton.setAttribute("data-loc", "general_setButton");
                                        abilityOverrideSetButton.innerHTML = loc("general_setButton");
                                        abilityOverrideInputGroup.appendChild(abilityOverrideSetButton);

                                        const abilityOverrideRemoveButton = document.createElement("button");
                                        abilityOverrideRemoveButton.classList = "btn btn-danger";
                                        abilityOverrideRemoveButton.setAttribute("type", "submit");
                                        abilityOverrideRemoveButton.setAttribute("value", "remove");
                                        abilityOverrideRemoveButton.setAttribute("data-loc", "code_remove");
                                        abilityOverrideRemoveButton.innerHTML = loc("code_remove");
                                        abilityOverrideInputGroup.appendChild(abilityOverrideRemoveButton);

                                        abilityOverrideForm.appendChild(abilityOverrideInputGroup);

                                        tabDiv.appendChild(abilityOverrideForm);
                                    }

                                    loadoutTabsContent.appendChild(tabDiv);
                                }
                            }
                        }
                    } else if (["LongGuns", "Pistols", "Melee", "SpaceGuns", "SpaceMelee"].includes(category)) {
                        document.getElementById("valenceBonus-card").classList.remove("d-none");
                        document.getElementById("valenceBonus-innateDamage").value = "";
                        document.getElementById("valenceBonus-procent").value = 25;

                        if (item.UpgradeFingerprint) {
                            const buff = JSON.parse(item.UpgradeFingerprint).buffs[0];
                            const buffValue = fromUpdradeFingerPrintVaule(buff.Value, 0.25);
                            document.getElementById("valenceBonus-innateDamage").value = buff.Tag ?? "";
                            document.getElementById("valenceBonus-procent").value = Math.round(buffValue * 1000) / 10;
                        }
                    }
                    if (modularWeapons.includes(item.ItemType)) {
                        document.getElementById("modularParts-card").classList.remove("d-none");
                        const form = document.getElementById("modularParts-form");
                        form.innerHTML = "";
                        const requiredParts = getRequiredParts(category, item.ItemType);

                        requiredParts.forEach(modularPart => {
                            const input = document.createElement("input");
                            input.classList.add("form-control");
                            input.id = "detailedView-modularPart-" + modularPart;
                            input.setAttribute("list", "datalist-ModularParts-" + modularPart);

                            const datalist = document.getElementById("datalist-ModularParts-" + modularPart);
                            const options = Array.from(datalist.options);

                            input.value =
                                options.find(option => item.ModularParts.includes(option.getAttribute("data-key")))
                                    ?.value || "";
                            form.appendChild(input);
                        });

                        const changeButton = document.createElement("button");
                        changeButton.classList.add("btn");
                        changeButton.classList.add("btn-primary");
                        changeButton.type = "submit";
                        changeButton.setAttribute("data-loc", "cheats_changeButton");
                        changeButton.innerHTML = loc("cheats_changeButton");
                        form.appendChild(changeButton);
                    }
                } else {
                    single.loadRoute("/webui/inventory");
                }
            }
            document.getElementById("changeSyndicate").value = data.SupportedSyndicate ?? "";

            if (single.getCurrentPath().startsWith("/webui/guildView")) {
                const guildReq = $.get("/custom/getGuild?guildId=" + window.guildId);
                guildReq.done(guildData => {
                    window.itemListPromise.then(itemMap => {
                        document.getElementById("guildView-loading").classList.add("d-none");
                        $("#guild-route > .row").removeClass("d-none");

                        document.getElementById("guildView-title").textContent = guildData.Name;
                        document.getElementById("guildView-tier").textContent = loc("guildView_tierDisplay")
                            .split("|TIER|")
                            .join(loc(`guildView_tier${guildData.Tier}`));
                        document.getElementById("guildView-class").textContent = loc("guildView_classDisplay")
                            .split("|CLASS|")
                            .join(guildData.Class);

                        ["VaultRegularCredits", "VaultPremiumCredits"].forEach(currency => {
                            document.getElementById(currency + "-owned").textContent = loc("guildView_currency_owned")
                                .split("|COUNT|")
                                .join((guildData[currency] ?? 0).toLocaleString());
                        });

                        const userGuildMember = guildData.Members.find(m => m._id.$oid === window.accountId);
                        let userGuildPermissions;
                        if (userGuildMember) {
                            userGuildPermissions = guildData.Ranks[userGuildMember.Rank].Permissions;
                            // Ruler = 1, // Clan: Change hierarchy. Alliance (Creator only): Kick clans.
                            // Advertiser = 8192,
                            // Recruiter = 2, // Send invites (Clans & Alliances)
                            // Regulator = 4, // Kick members
                            // Promoter = 8, // Clan: Promote and demote members. Alliance (Creator only): Change clan permissions.
                            // Architect = 16, // Create and destroy rooms
                            // Host = 32, // No longer used in modern versions
                            // Decorator = 1024, // Create and destroy decos
                            // Treasurer = 64, // Clan: Contribute from vault and edit tax rate. Alliance: Divvy vault.
                            // Tech = 128, // Queue research
                            // ChatModerator = 512, // (Clans & Alliances)
                            // Herald = 2048, // Change MOTD
                            // Fabricator = 4096 // Replicate research
                            if (userGuildPermissions & 128) {
                                document.getElementById("techProjects-form").classList.remove("d-none");
                            }
                            if (userGuildPermissions & 16) {
                                document.getElementById("vaultDecoRecipes-form").classList.remove("d-none");
                            }
                            if (userGuildPermissions & 64) {
                                document.getElementById("vaultRegularCredits-form").classList.remove("d-none");
                                document.getElementById("VaultRegularCredits-owned").classList.remove("mb-0");
                                document.getElementById("vaultPremiumCredits-form").classList.remove("d-none");
                                document.getElementById("VaultPremiumCredits-owned").classList.remove("mb-0");
                                document.getElementById("vaultMiscItems-form").classList.remove("d-none");
                                document.getElementById("vaultShipDecorations-form").classList.remove("d-none");
                            }
                            if (userGuildMember.Rank <= 1) {
                                document.querySelectorAll("#guild-actions button").forEach(btn => {
                                    btn.disabled = false;
                                });
                            }
                        }

                        const guildCheats = document.querySelectorAll("#guild-cheats input[id]");
                        for (const elm of guildCheats) {
                            elm.checked = !!guildData[elm.id];
                            if (!userGuildMember || userGuildMember.Rank > 1) {
                                elm.disabled = true;
                            } else {
                                elm.disabled = false;
                            }
                        }

                        document.getElementById("TechProjects-list").innerHTML = "";
                        guildData.TechProjects ??= [];
                        guildData.TechProjects.forEach(item => {
                            const tr = document.createElement("tr");
                            tr.setAttribute("data-item-type", item.ItemType);
                            {
                                const td = document.createElement("td");
                                td.textContent = itemMap[item.ItemType]?.name ?? item.ItemType;
                                if (new Date(item.CompletionDate) < new Date()) {
                                    td.textContent += " | " + loc("code_completed");
                                } else if (item.State == 1) {
                                    td.textContent += " | " + loc("code_funded");
                                }
                                tr.appendChild(td);
                            }
                            {
                                const td = document.createElement("td");
                                td.classList = "text-end text-nowrap";

                                if (userGuildPermissions && userGuildPermissions & 128 && item.State != 1) {
                                    const a = document.createElement("a");
                                    a.href = "#";
                                    a.onclick = function (event) {
                                        event.preventDefault();
                                        debounce(fundGuildTechProject, item.ItemType);
                                    };
                                    a.title = loc("code_fund");
                                    a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--!Font Awesome Free v7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M214.6 17.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 117.3 160 488c0 17.7 14.3 32 32 32s32-14.3 32-32l0-370.7 105.4 105.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"/></svg>`;
                                    td.appendChild(a);
                                }

                                if (
                                    userGuildPermissions &&
                                    userGuildPermissions & 128 &&
                                    item.State == 1 &&
                                    new Date(item.CompletionDate) > new Date()
                                ) {
                                    const a = document.createElement("a");
                                    a.href = "#";
                                    a.onclick = function (event) {
                                        event.preventDefault();
                                        debounce(completeGuildTechProject, item.ItemType);
                                    };
                                    a.title = loc("code_complete");
                                    a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--!Font Awesome Free v7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M371.7 43.1C360.1 32 343 28.9 328.3 35.2S304 56 304 72l0 136.3-172.3-165.1C120.1 32 103 28.9 88.3 35.2S64 56 64 72l0 368c0 16 9.6 30.5 24.3 36.8s31.8 3.2 43.4-7.9L304 303.7 304 440c0 16 9.6 30.5 24.3 36.8s31.8 3.2 43.4-7.9l192-184c7.9-7.5 12.3-18 12.3-28.9s-4.5-21.3-12.3-28.9l-192-184z"/></svg>`;
                                    td.appendChild(a);
                                }

                                if (userGuildMember && userGuildMember.Rank <= 1) {
                                    const a = document.createElement("a");
                                    a.href = "#";
                                    a.onclick = function (event) {
                                        event.preventDefault();
                                        debounce(removeGuildTechProject, item.ItemType);
                                    };
                                    a.title = loc("code_remove");
                                    a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>`;
                                    td.appendChild(a);
                                }

                                tr.appendChild(td);
                            }

                            document.getElementById("TechProjects-list").appendChild(tr);
                        });

                        ["VaultDecoRecipes", "VaultMiscItems", "VaultShipDecorations"].forEach(vaultKey => {
                            document.getElementById(vaultKey + "-list").innerHTML = "";
                            (guildData[vaultKey] ??= []).forEach(item => {
                                const tr = document.createElement("tr");
                                tr.setAttribute("data-item-type", item.ItemType);
                                {
                                    const td = document.createElement("td");
                                    td.textContent = itemMap[item.ItemType]?.name ?? item.ItemType;
                                    if (item.ItemCount > 1) {
                                        td.innerHTML += ` <span title='${loc("code_count")}'>🗍 ${parseInt(item.ItemCount)}</span>`;
                                    }
                                    tr.appendChild(td);
                                }
                                {
                                    const td = document.createElement("td");
                                    td.classList = "text-end text-nowrap";
                                    const canRemove =
                                        vaultKey === "VaultDecoRecipes"
                                            ? userGuildMember && userGuildMember.Rank <= 1
                                            : userGuildPermissions && userGuildPermissions & 64;
                                    if (canRemove) {
                                        const a = document.createElement("a");
                                        a.href = "#";
                                        a.title = loc("code_remove");
                                        a.onclick = e => {
                                            e.preventDefault();
                                            removeVaultItem(vaultKey, item.ItemType, item.ItemCount * -1);
                                        };
                                        a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>`;
                                        td.appendChild(a);
                                    }
                                    tr.appendChild(td);
                                }

                                document.getElementById(vaultKey + "-list").appendChild(tr);
                            });
                        });

                        document.getElementById("Members-list").innerHTML = "";
                        guildData.Members.forEach(member => {
                            const tr = document.createElement("tr");
                            {
                                const td = document.createElement("td");
                                const memberRank = guildData.Ranks[member.Rank];
                                td.textContent = member.DisplayName;
                                td.textContent += " | " + itemMap[memberRank.Name]?.name ?? memberRank.Name;
                                if (member.Status != 0) {
                                    td.textContent += " | " + loc("guildView_pending");
                                }
                                tr.appendChild(td);
                            }
                            {
                                const td = document.createElement("td");
                                td.classList = "text-end text-nowrap";

                                if (
                                    userGuildMember &&
                                    member.Rank < 8 &&
                                    member.Rank > userGuildMember.Rank &&
                                    userGuildPermissions &&
                                    userGuildPermissions & 8
                                ) {
                                    const a = document.createElement("a");
                                    a.href = "#";
                                    a.onclick = function (event) {
                                        event.preventDefault();
                                        changeGuildRank(guildId, member._id.$oid, member.Rank + 1);
                                    };
                                    a.title = loc("guildView_demote");
                                    a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg>`;
                                    td.appendChild(a);
                                }
                                if (
                                    userGuildMember &&
                                    member.Rank > userGuildMember.Rank &&
                                    userGuildPermissions &&
                                    userGuildPermissions & 8
                                ) {
                                    const a = document.createElement("a");
                                    a.href = "#";
                                    a.onclick = function (event) {
                                        event.preventDefault();
                                        changeGuildRank(guildId, member._id.$oid, member.Rank - 1);
                                    };
                                    a.title = loc("guildView_promote");
                                    a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"/></svg>`;
                                    td.appendChild(a);
                                }

                                if (
                                    (userGuildMember &&
                                        member.Rank > userGuildMember.Rank &&
                                        userGuildPermissions &&
                                        userGuildPermissions & 4) ||
                                    (userGuildMember && userGuildMember.Rank != 0 && userGuildMember._id == member._id)
                                ) {
                                    const a = document.createElement("a");
                                    a.href = "#";
                                    a.onclick = function (event) {
                                        event.preventDefault();
                                        kickFromGuild(member._id.$oid);
                                    };
                                    a.title = loc("code_remove");
                                    a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>`;
                                    td.appendChild(a);
                                }

                                tr.appendChild(td);
                            }

                            document.getElementById("Members-list").appendChild(tr);
                        });

                        if (guildData.AllianceId) {
                            const allianceReq = $.get("/custom/getAlliance?guildId=" + guildId);
                            allianceReq.done(allianceData => {
                                document.getElementById("guildView-alliance").textContent =
                                    loc("guildView_alliance") + ": " + allianceData.Name;

                                let userAlliancePermisssions;
                                if (userGuildMember && userGuildMember.Rank <= 1) {
                                    userAlliancePermisssions = allianceData.Clans.find(
                                        c => c._id.$oid === guildId
                                    ).Permissions;
                                }
                                document.getElementById("Alliance-list").innerHTML = "";
                                allianceData.Clans.forEach(clan => {
                                    const tr = document.createElement("tr");
                                    {
                                        const td = document.createElement("td");
                                        td.textContent = clan.Name;
                                        if (clan.Pending) {
                                            td.textContent += " | " + loc("guildView_pending");
                                        }
                                        tr.appendChild(td);
                                    }
                                    {
                                        const td = document.createElement("td");
                                        td.classList = "text-end text-nowrap";

                                        if (
                                            !(clan.Permissions & 1) &&
                                            userAlliancePermisssions &&
                                            userAlliancePermisssions & 1
                                        ) {
                                            const a = document.createElement("a");
                                            a.href = "#";
                                            a.onclick = function (event) {
                                                event.preventDefault();
                                                kickFromAlliance(clan._id.$oid);
                                            };
                                            a.title = loc("code_remove");
                                            a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>`;
                                            td.appendChild(a);
                                        }

                                        tr.appendChild(td);
                                    }

                                    document.getElementById("Alliance-list").appendChild(tr);
                                });
                            });
                        }
                    });
                });

                guildReq.fail(() => {
                    document.getElementById("guildView-loading").classList.add("d-none");
                    document.getElementById("guildView-na").classList.remove("d-none");
                    document.getElementById("guildView-naDescription").classList.remove("d-none");
                });
            }

            for (const elm of accountCheats) {
                if (elm.type === "checkbox") {
                    elm.checked = !!data[elm.id];
                } else if (elm.type === "number") {
                    elm.value = data[elm.id] !== undefined ? data[elm.id] : elm.getAttribute("data-default") || "";
                }
            }
        });
    });
}

function changeGuildRank(guildId, targetId, rankChange) {
    revalidateAuthz().then(() => {
        const req = $.get(
            "/api/changeGuildRank.php?" +
                window.authz +
                "&guildId=" +
                guildId +
                "&targetId=" +
                targetId +
                "&rankChange=" +
                rankChange
        );
        req.done(() => {
            updateInventory();
        });
    });
}

function kickFromGuild(accountId) {
    revalidateAuthz().then(() => {
        const req = $.post({
            url: "/api/removeFromGuild.php?" + window.authz + "&guildId=" + window.guildId,
            contentType: "application/octet-stream",
            data: JSON.stringify({
                userId: accountId
            })
        });
        req.done(() => {
            updateInventory();
        });
    });
}

function kickFromAlliance(guildId) {
    revalidateAuthz().then(() => {
        const req = $.get("/api/removeFromAlliance.php?" + window.authz + "&guildId=" + guildId);
        req.done(() => {
            updateInventory();
        });
    });
}

function getKey(input) {
    return document
        .getElementById(input.getAttribute("list"))
        .querySelector("[value='" + input.value.split("'").join("\\'") + "']")
        ?.getAttribute("data-key");
}

function doAcquireEquipment(category) {
    const uniqueName = getKey(document.getElementById("acquire-type-" + category));
    if (!uniqueName) {
        $("#acquire-type-" + category)
            .addClass("is-invalid")
            .focus();
        return;
    }
    revalidateAuthz().then(() => {
        const req = $.post({
            url: "/custom/addItems?" + window.authz,
            contentType: "application/json",
            data: JSON.stringify([
                {
                    ItemType: uniqueName,
                    ItemCount: 1
                }
            ])
        });
        req.done(didAnything => {
            document.getElementById("acquire-type-" + category).value = "";
            if (didAnything) {
                updateInventory();
            } else {
                toast(loc("code_nothingToDo"));
            }
        });
    });
}

function removeCustomization(uniqueName) {
    revalidateAuthz().then(() => {
        const req = $.get("/custom/removeCustomization?" + window.authz + "&itemType=" + uniqueName);
        req.done(() => {
            updateInventory();
        });
    });
}

function removeIsNew() {
    revalidateAuthz().then(() => {
        const req = $.get("/custom/removeIsNew?" + window.authz);
        req.done(() => {
            updateInventory();
        });
    });
}

function getRequiredParts(category, WeaponType) {
    switch (category) {
        case "Hoverboards":
            return ["HB_DECK", "HB_ENGINE", "HB_FRONT", "HB_JET"];

        case "OperatorAmps":
            return ["AMP_OCULUS", "AMP_CORE", "AMP_BRACE"];

        case "Melee":
            return ["BLADE", "HILT", "HILT_WEIGHT"];

        case "LongGuns":
            return ["GUN_BARREL", "GUN_PRIMARY_HANDLE", "GUN_CLIP"];

        case "Pistols":
            return ["GUN_BARREL", "GUN_SECONDARY_HANDLE", "GUN_CLIP"];

        case "MoaPets":
            return WeaponType === "/Lotus/Types/Friendly/Pets/MoaPets/MoaPetPowerSuit"
                ? ["MOA_ENGINE", "MOA_PAYLOAD", "MOA_HEAD", "MOA_LEG"]
                : ["ZANUKA_BODY", "ZANUKA_HEAD", "ZANUKA_LEG", "ZANUKA_TAIL"];

        case "KubrowPets": {
            return WeaponType.endsWith("InfestedCatbrowPetPowerSuit")
                ? ["CATBROW_ANTIGEN", "CATBROW_MUTAGEN"]
                : ["KUBROW_ANTIGEN", "KUBROW_MUTAGEN"];
        }
    }
}

function doAcquireModularEquipment(category, WeaponType) {
    if (category === "Hoverboards") WeaponType = "/Lotus/Types/Vehicles/Hoverboard/HoverboardSuit";
    const requiredParts = getRequiredParts(category, WeaponType);
    let Parts = [];

    requiredParts.forEach(part => {
        const partName = getKey(document.getElementById("acquire-type-" + category + "-" + part));
        if (partName) {
            Parts.push(partName);
        }
    });
    if (Parts.length != requiredParts.length) {
        let isFirstPart = true;
        requiredParts.forEach(part => {
            const partSelector = document.getElementById("acquire-type-" + category + "-" + part);
            if (!getKey(partSelector)) {
                if (isFirstPart) {
                    isFirstPart = false;
                    $("#acquire-type-" + category + "-" + part)
                        .addClass("is-invalid")
                        .focus();
                } else {
                    $("#acquire-type-" + category + "-" + part).addClass("is-invalid");
                }
            }
        });
    } else {
        const mapping = {
            LongGuns: {
                "/Lotus/Weapons/SolarisUnited/Secondary/SUModularSecondarySet1/Barrel/SUModularSecondaryBarrelAPart":
                    "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryShotgun",
                "/Lotus/Weapons/Infested/Pistols/InfKitGun/Barrels/InfBarrelEgg/InfModularBarrelEggPart":
                    "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryShotgun",
                "/Lotus/Weapons/SolarisUnited/Secondary/SUModularSecondarySet1/Barrel/SUModularSecondaryBarrelBPart":
                    "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimary",
                "/Lotus/Weapons/SolarisUnited/Secondary/SUModularSecondarySet1/Barrel/SUModularSecondaryBarrelCPart":
                    "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimary",
                "/Lotus/Weapons/SolarisUnited/Secondary/SUModularSecondarySet1/Barrel/SUModularSecondaryBarrelDPart":
                    "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryBeam",
                "/Lotus/Weapons/Infested/Pistols/InfKitGun/Barrels/InfBarrelBeam/InfModularBarrelBeamPart":
                    "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryBeam"
            },
            Pistols: {
                "/Lotus/Weapons/SolarisUnited/Secondary/SUModularSecondarySet1/Barrel/SUModularSecondaryBarrelAPart":
                    "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondaryShotgun",
                "/Lotus/Weapons/Infested/Pistols/InfKitGun/Barrels/InfBarrelEgg/InfModularBarrelEggPart":
                    "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondaryShotgun",
                "/Lotus/Weapons/SolarisUnited/Secondary/SUModularSecondarySet1/Barrel/SUModularSecondaryBarrelBPart":
                    "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondary",
                "/Lotus/Weapons/SolarisUnited/Secondary/SUModularSecondarySet1/Barrel/SUModularSecondaryBarrelCPart":
                    "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondary",
                "/Lotus/Weapons/SolarisUnited/Secondary/SUModularSecondarySet1/Barrel/SUModularSecondaryBarrelDPart":
                    "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondaryBeam",
                "/Lotus/Weapons/Infested/Pistols/InfKitGun/Barrels/InfBarrelBeam/InfModularBarrelBeamPart":
                    "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondaryBeam"
            },
            MoaPets: {
                "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHeadA":
                    "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetAPowerSuit",
                "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHeadB":
                    "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetBPowerSuit",
                "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetParts/ZanukaPetPartHeadC":
                    "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetCPowerSuit"
            }
        };

        Parts.forEach(part => {
            const categoryMap = mapping[category];
            if (categoryMap && categoryMap[part]) {
                WeaponType = categoryMap[part];
            }
        });
        if (category == "KubrowPets") Parts.unshift(WeaponType);
        revalidateAuthz().then(() => {
            const req = $.post({
                url: "/api/modularWeaponCrafting.php?" + window.authz,
                contentType: "application/octet-stream",
                data: JSON.stringify({
                    WeaponType,
                    Parts,
                    isWebUi: true
                })
            });
            req.done(() => {
                const mainInput = document.getElementById("acquire-type-" + category);
                if (mainInput) {
                    mainInput.value = "";
                    if (category === "MoaPets") {
                        document.getElementById("modular-MoaPets-Zanuka").classList.add("d-none");
                        document.getElementById("modular-MoaPets-Moa").classList.add("d-none");
                    } else if (category === "KubrowPets") {
                        document.getElementById("modular-KubrowPets-Catbrow").classList.add("d-none");
                        document.getElementById("modular-KubrowPets-Kubrow").classList.add("d-none");
                    } else {
                        document.getElementById("modular-" + category).classList.add("d-none");
                    }
                }
                requiredParts.forEach(part => {
                    document.getElementById("acquire-type-" + category + "-" + part).value = "";
                });
                updateInventory();
            });
        });
    }
}

function doAcquireEvolution() {
    const uniqueName = getKey(document.getElementById("acquire-type-EvolutionProgress"));
    if (!uniqueName) {
        $("#acquire-type-EvolutionProgress").addClass("is-invalid").focus();
        return;
    }
    if (!document.querySelector("#EvolutionProgress-list [data-item-type='" + uniqueName + "']")) {
        setEvolutionProgress([{ ItemType: uniqueName, Rank: permanentEvolutionWeapons.has(uniqueName) ? 0 : 1 }]);
    } else {
        toast(loc("code_nothingToDo"));
    }
}

$(document).on("input", "input", function () {
    $(this).removeClass("is-invalid");
});

function dispatchAddItemsRequestsBatch(requests) {
    return new Promise(resolve => {
        revalidateAuthz().then(() => {
            const req = $.post({
                url: "/custom/addItems?" + window.authz,
                contentType: "application/json",
                data: JSON.stringify(requests)
            });
            req.done(() => {
                updateInventory();
                resolve();
            });
        });
    });
}

function addMissingEquipment(categories) {
    const requests = [];
    categories.forEach(category => {
        document.querySelectorAll("#datalist-" + category + " option").forEach(elm => {
            if (
                !document.querySelector(
                    "#" + category + "-list [data-item-type='" + elm.getAttribute("data-key") + "']"
                )
            ) {
                if (!webUiModularWeapons.includes(elm.getAttribute("data-key"))) {
                    let ItemCount = 1;
                    if (category == "ShipDecorations") ItemCount = 999999;
                    requests.push({ ItemType: elm.getAttribute("data-key"), ItemCount });
                }
            }
        });
    });
    if (requests.length != 0 && window.confirm(loc("code_addItemsConfirm").split("|COUNT|").join(requests.length))) {
        return dispatchAddItemsRequestsBatch(requests);
    }
}

function addVaultItem(vaultType) {
    const ItemType = getKey(document.getElementById(`acquire-type-${vaultType}`));
    if (!ItemType) {
        $(`#acquire-type-${vaultType}`).addClass("is-invalid").focus();
        return;
    }
    const ItemCount = ["VaultMiscItems", "VaultShipDecorations"].includes(vaultType)
        ? parseInt($(`#${vaultType}-count`).val())
        : 1;
    if (ItemCount != 0 && !Number.isNaN(ItemCount)) {
        revalidateAuthz().then(() => {
            const req = $.post({
                url: "/custom/addVaultTypeCount?" + window.authz + "&guildId=" + window.guildId,
                contentType: "application/json",
                data: JSON.stringify({
                    vaultType,
                    items: [
                        {
                            ItemType,
                            ItemCount
                        }
                    ]
                })
            });
            req.done(() => {
                document.getElementById(`acquire-type-${vaultType}`).value = "";
                updateInventory();
            });
        });
    }
}

function removeVaultItem(vaultType, ItemType, ItemCount) {
    revalidateAuthz().then(() => {
        const req = $.post({
            url: "/custom/addVaultTypeCount?" + window.authz + "&guildId=" + window.guildId,
            contentType: "application/json",
            data: JSON.stringify({
                vaultType,
                items: [
                    {
                        ItemType,
                        ItemCount
                    }
                ]
            })
        });
        req.done(() => {
            updateInventory();
        });
    });
}

function addGuildTechProject() {
    const uniqueName = getKey(document.getElementById("acquire-type-TechProjects"));
    if (!uniqueName) {
        $("#acquire-type-TechProjects").addClass("is-invalid").focus();
        return;
    }
    revalidateAuthz().then(() => {
        const req = $.post({
            url: "/custom/addTechProject?" + window.authz + "&guildId=" + window.guildId,
            contentType: "application/json",
            data: JSON.stringify([
                {
                    ItemType: uniqueName
                }
            ])
        });
        req.done(() => {
            document.getElementById("acquire-type-TechProjects").value = "";
            updateInventory();
        });
    });
}

function removeGuildTechProject(uniqueName) {
    revalidateAuthz().then(() => {
        const req = $.post({
            url: "/custom/removeTechProject?" + window.authz + "&guildId=" + window.guildId,
            contentType: "application/json",
            data: JSON.stringify([
                {
                    ItemType: uniqueName
                }
            ])
        });
        req.done(() => {
            updateInventory();
        });
    });
}

function completeGuildTechProject(uniqueName) {
    revalidateAuthz().then(() => {
        const req = $.post({
            url: "/custom/completeTechProject?" + window.authz + "&guildId=" + window.guildId,
            contentType: "application/json",
            data: JSON.stringify([
                {
                    ItemType: uniqueName
                }
            ])
        });
        req.done(() => {
            updateInventory();
        });
    });
}

function fundGuildTechProject(uniqueName) {
    revalidateAuthz().then(() => {
        const req = $.post({
            url: "/custom/fundTechProject?" + window.authz + "&guildId=" + window.guildId,
            contentType: "application/json",
            data: JSON.stringify([
                {
                    ItemType: uniqueName
                }
            ])
        });
        req.done(() => {
            updateInventory();
        });
    });
}

function dispatchAddVaultItemsBatch(requests, vaultType) {
    return new Promise(resolve => {
        revalidateAuthz().then(() => {
            const req = $.post({
                url: "/custom/addVaultItems?" + window.authz + "&guildId=" + window.guildId,
                contentType: "application/json",
                data: JSON.stringify({
                    vaultType,
                    items: requests
                })
            });
            req.done(() => {
                updateInventory();
                resolve();
            });
        });
    });
}

function addMissingVaultItems(vaultType) {
    const requests = [];

    document.querySelectorAll(`#datalist-${vaultType} option`).forEach(elm => {
        const datalist = vaultType === "VaultShipDecorations" ? "ShipDecorations" : vaultType;
        if (!document.querySelector(`#${datalist}-list [data-item-type='${elm.getAttribute("data-key")}']`)) {
            let ItemCount = 1;
            if (category == "VaultShipDecorations") ItemCount = 999999;
            requests.push({ ItemType: elm.getAttribute("data-key"), ItemCount });
        }
    });

    if (
        requests.length != 0 &&
        window.confirm(loc("code_addVaultItemsConfirm").split("|COUNT|").join(requests.length))
    ) {
        return dispatchAddVaultItemsBatch(requests, vaultType);
    }
}

function dispatchAddTechProjectsBatch(requests) {
    return new Promise(resolve => {
        revalidateAuthz().then(() => {
            const req = $.post({
                url: "/custom/addTechProject?" + window.authz + "&guildId=" + window.guildId,
                contentType: "application/json",
                data: JSON.stringify(requests)
            });
            req.done(() => {
                updateInventory();
                resolve();
            });
        });
    });
}

function addMissingTechProjects() {
    const requests = [];

    document.querySelectorAll("#datalist-TechProjects option").forEach(elm => {
        if (!document.querySelector("#TechProjects-list [data-item-type='" + elm.getAttribute("data-key") + "']")) {
            requests.push({ ItemType: elm.getAttribute("data-key") });
        }
    });

    if (
        requests.length != 0 &&
        window.confirm(loc("code_addTechProjectsConfirm").split("|COUNT|").join(requests.length))
    ) {
        return dispatchAddTechProjectsBatch(requests);
    }
}

function dispatchFundTechProjectsBatch(requests) {
    return new Promise(resolve => {
        revalidateAuthz().then(() => {
            const req = $.post({
                url: "/custom/fundTechProject?" + window.authz + "&guildId=" + window.guildId,
                contentType: "application/json",
                data: JSON.stringify(requests)
            });
            req.done(() => {
                updateInventory();
                resolve();
            });
        });
    });
}

function fundAllTechProjects() {
    revalidateAuthz().then(() => {
        const req = $.get("/custom/getGuild?guildId=" + window.guildId);
        req.done(data => {
            const requests = [];
            data.TechProjects ??= [];
            data.TechProjects.forEach(techProject => {
                if (techProject.State != 1) {
                    requests.push({
                        ItemType: techProject.ItemType
                    });
                }
            });

            if (Object.keys(requests).length > 0) {
                return dispatchFundTechProjectsBatch(requests);
            }
        });
    });
}

function dispatchCompleteTechProjectsBatch(requests) {
    return new Promise(resolve => {
        revalidateAuthz().then(() => {
            const req = $.post({
                url: "/custom/completeTechProject?" + window.authz + "&guildId=" + window.guildId,
                contentType: "application/json",
                data: JSON.stringify(requests)
            });
            req.done(() => {
                updateInventory();
                resolve();
            });
        });
    });
}

function completeAllTechProjects() {
    revalidateAuthz().then(() => {
        const req = $.get("/custom/getGuild?guildId=" + window.guildId);
        req.done(data => {
            const requests = [];
            data.TechProjects ??= [];
            data.TechProjects.forEach(techProject => {
                if (techProject.State == 1 && new Date(techProject.CompletionDate) > new Date()) {
                    requests.push({
                        ItemType: techProject.ItemType
                    });
                }
            });

            if (Object.keys(requests).length > 0) {
                return dispatchCompleteTechProjectsBatch(requests);
            }
        });
    });
}

async function addMissingHelminthRecipes() {
    await revalidateAuthz();
    await fetch("/custom/addMissingHelminthBlueprints?" + window.authz);
}

function addMissingEvolutionProgress() {
    const requests = [];
    document.querySelectorAll("#datalist-EvolutionProgress option").forEach(elm => {
        const uniqueName = elm.getAttribute("data-key");
        if (!document.querySelector("#EvolutionProgress-list [data-item-type='" + uniqueName + "']")) {
            requests.push({ ItemType: uniqueName, Rank: permanentEvolutionWeapons.has(uniqueName) ? 0 : 1 });
        }
    });
    if (requests.length == 0) {
        toast(loc("code_nothingToDo"));
    } else if (window.confirm(loc("code_addItemsConfirm").split("|COUNT|").join(requests.length))) {
        setEvolutionProgress(requests);
    }
}

function maxRankAllEvolutions() {
    revalidateAuthz().then(() => {
        getInventoryData().then(data => {
            const requests = [];

            data.EvolutionProgress.forEach(item => {
                if (item.Rank < 5) {
                    requests.push({
                        ItemType: item.ItemType,
                        Rank: 5
                    });
                }
            });

            if (Object.keys(requests).length > 0) {
                return setEvolutionProgress(requests).then(() => {
                    toast(loc("code_succRankUp"));
                });
            }

            toast(loc("code_noEquipmentToRankUp"));
        });
    });
}

function maxRankAllEquipment(categories) {
    revalidateAuthz().then(() => {
        getInventoryData().then(data => {
            window.itemListPromise.then(itemMap => {
                const batchData = {};

                categories.forEach(category => {
                    data[category].forEach(item => {
                        const maxXP =
                            category === "Suits" ||
                            category === "SpaceSuits" ||
                            category === "Sentinels" ||
                            category === "Hoverboards"
                                ? 1_600_000
                                : 800_000;

                        if (item.XP < maxXP) {
                            if (!batchData[category]) {
                                batchData[category] = [];
                            }
                            batchData[category].push({
                                ItemId: { $oid: item.ItemId.$oid },
                                XP: maxXP
                            });
                        }
                        if (item.ItemType in itemMap && "exalted" in itemMap[item.ItemType]) {
                            for (const exaltedType of itemMap[item.ItemType].exalted) {
                                const exaltedItem = data["SpecialItems"].find(x => x.ItemType == exaltedType);
                                if (exaltedItem) {
                                    const exaltedCap = itemMap[exaltedType]?.type == "weapons" ? 800_000 : 1_600_000;
                                    if (exaltedItem.XP < exaltedCap) {
                                        batchData["SpecialItems"] ??= [];
                                        batchData["SpecialItems"].push({
                                            ItemId: { $oid: exaltedItem.ItemId.$oid },
                                            XP: exaltedCap
                                        });
                                    }
                                }
                            }
                        }
                    });
                });

                if (Object.keys(batchData).length > 0) {
                    return sendBatchGearExp(batchData);
                }

                toast(loc("code_noEquipmentToRankUp"));
            });
        });
    });
}

// Assumes that caller revalidates authz
function addGearExp(category, oid, xp) {
    const data = {};
    data[category] = [
        {
            ItemId: { $oid: oid },
            XP: xp
        }
    ];
    return new Promise((resolve, reject) => {
        $.post({
            url: "/custom/addXp?" + window.authz,
            contentType: "application/json",
            data: JSON.stringify(data)
        })
            .done(resolve)
            .fail(reject);
    });
}

function sendBatchGearExp(data) {
    revalidateAuthz().then(() => {
        $.post({
            url: "/custom/addXp?" + window.authz,
            contentType: "application/json",
            data: JSON.stringify(data)
        }).done(() => {
            toast(loc("code_succRankUp"));
            updateInventory();
        });
    });
}

function renameGear(category, oid, name) {
    revalidateAuthz().then(() => {
        if (category == "KubrowPets") {
            $.post({
                url: "/api/renamePet.php?" + window.authz + "&webui=1",
                contentType: "text/plain",
                data: JSON.stringify({
                    petId: oid,
                    name: name
                })
            }).done(function () {
                updateInventory();
            });
        } else {
            $.post({
                url: "/api/nameWeapon.php?" + window.authz + "&Category=" + category + "&ItemId=" + oid + "&webui=1",
                contentType: "text/plain",
                data: JSON.stringify({
                    ItemName: name
                })
            }).done(function () {
                updateInventory();
            });
        }
    });
}

function disposeOfGear(category, oid) {
    if (category == "KubrowPets") {
        revalidateAuthz().then(() => {
            $.post({
                url: "/api/releasePet.php?" + window.authz,
                contentType: "application/octet-stream",
                data: JSON.stringify({
                    Recipe: "webui",
                    petId: oid
                })
            });
        });
    } else {
        const data = {
            SellCurrency: "SC_RegularCredits",
            SellPrice: 0,
            Items: {}
        };
        data.Items[category] = [
            {
                String: oid,
                Count: 0
            }
        ];
        revalidateAuthz().then(() => {
            $.post({
                url: "/api/sell.php?" + window.authz,
                contentType: "text/plain",
                data: JSON.stringify(data)
            });
        });
    }
}

function disposeOfItems(category, type, count) {
    const data = {
        SellCurrency: "SC_RegularCredits",
        SellPrice: 0,
        Items: {}
    };
    data.Items[category] = [
        {
            String: type,
            Count: count
        }
    ];
    revalidateAuthz().then(() => {
        $.post({
            url: "/api/sell.php?" + window.authz,
            contentType: "text/plain",
            data: JSON.stringify(data)
        });
    });
}

function equipmentFeatures(category, oid, bit) {
    revalidateAuthz().then(() => {
        $.get(
            "/custom/equipmentFeatures?" + window.authz + "&ItemId=" + oid + "&Category=" + category + "&bit=" + bit
        ).done(function () {
            updateInventory();
        });
    });
}

function unlockLevelCap(category, oid, formas) {
    revalidateAuthz().then(() => {
        $.post({
            url: "/custom/unlockLevelCap?" + window.authz,
            contentType: "application/json",
            data: JSON.stringify({
                Category: category,
                ItemId: oid,
                Polarized: formas
            })
        }).done(function () {
            updateInventory();
        });
    });
}

function maturePet(oid, revert) {
    revalidateAuthz().then(() => {
        $.post({
            url: "/api/maturePet.php?" + window.authz,
            contentType: "application/octet-stream",
            data: JSON.stringify({
                petId: oid,
                revert
            })
        }).done(function () {
            updateInventory();
        });
    });
}

function setEvolutionProgress(requests) {
    return new Promise(resolve => {
        revalidateAuthz().then(() => {
            const req = $.post({
                url: "/custom/setEvolutionProgress?" + window.authz,
                contentType: "application/json",
                data: JSON.stringify(requests)
            });
            req.done(() => {
                updateInventory();
                resolve();
            });
        });
    });
}

function doAcquireCountItems(category) {
    const uniqueName = getKey(document.getElementById("acquire-type-" + category));
    if (!uniqueName) {
        $(`#acquire-type-${category}`).addClass("is-invalid").focus();
        return;
    }
    const count = parseInt($(`#${category}-count`).val());
    if (count != 0 && !Number.isNaN(count)) {
        revalidateAuthz().then(() => {
            $.post({
                url: "/custom/addItems?" + window.authz,
                contentType: "application/json",
                data: JSON.stringify([
                    {
                        ItemType: uniqueName,
                        ItemCount: count
                    }
                ])
            })
                .done(function (didAnything) {
                    if (didAnything) {
                        if (count > 0) {
                            toast(loc("code_succAdded"));
                        } else {
                            toast(loc("code_succRemoved"));
                        }
                    } else {
                        toast(loc("code_nothingToDo"));
                    }
                    if (category != "miscitems") updateInventory();
                })
                .fail(r => {
                    toast(r.responseText);
                });
        });
    }
}

function removeCountItems(uniqueName, count) {
    revalidateAuthz().then(() => {
        $.post({
            url: "/custom/addItems?" + window.authz,
            contentType: "application/json",
            data: JSON.stringify([
                {
                    ItemType: uniqueName,
                    ItemCount: count * -1
                }
            ])
        }).done(function () {
            toast(loc("code_succRemoved"));
            updateInventory();
        });
    });
}

function addItemByItemType() {
    const ItemType = document.getElementById("typeName-type").value;
    // Must start with "/Lotus/", contain only letters A–Z, digits 0–9, no "//", and not end with "/"
    if (!ItemType || !/^\/Lotus\/(?:[A-Za-z0-9]+(?:\/[A-Za-z0-9]+)*)$/.test(ItemType)) {
        $("#typeName-type").addClass("is-invalid").focus();
        return;
    }
    revalidateAuthz().then(() => {
        $.post({
            url: "/custom/addItems?" + window.authz,
            contentType: "application/json",
            data: JSON.stringify([
                {
                    ItemType,
                    ItemCount: 1
                }
            ])
        })
            .done(function (_, _, jqXHR) {
                if (jqXHR.status === 200) {
                    updateInventory();
                }
            })
            .fail(function () {
                $("#typeName-type").addClass("is-invalid").focus();
            });
    });
}

function doAcquireRiven() {
    let fingerprint;
    try {
        fingerprint = JSON.parse($("#addriven-fingerprint").val());
        if (typeof fingerprint !== "object") {
            fingerprint = JSON.parse(fingerprint);
        }
    } catch (e) {
        /* empty */
    }
    if (
        typeof fingerprint !== "object" ||
        !("compat" in fingerprint) ||
        !("pol" in fingerprint) ||
        !("buffs" in fingerprint)
    ) {
        $("#addriven-fingerprint").addClass("is-invalid").focus();
        return;
    }
    const uniqueName = "/Lotus/Upgrades/Mods/Randomized/" + $("#addriven-type").val();
    revalidateAuthz().then(() => {
        // Add riven type to inventory
        $.post({
            url: "/custom/addItems?" + window.authz,
            contentType: "application/json",
            data: JSON.stringify([
                {
                    ItemType: uniqueName,
                    ItemCount: 1
                }
            ])
        }).done(function () {
            // Get riven's assigned id
            $.get("/api/inventory.php?" + window.authz + "&xpBasedLevelCapDisabled=1&ignoreBuildLabel=1").done(data => {
                for (const rawUpgrade of data.RawUpgrades) {
                    if (rawUpgrade.ItemType === uniqueName) {
                        // Add fingerprint to riven
                        $.post({
                            url: "/api/artifacts.php?" + window.authz + "&ignoreBuildLabel=1",
                            contentType: "text/plain",
                            data: JSON.stringify({
                                Upgrade: {
                                    ItemType: uniqueName,
                                    UpgradeFingerprint: JSON.stringify(fingerprint),
                                    ItemId: rawUpgrade.LastAdded
                                },
                                LevelDiff: 0,
                                Cost: 0,
                                FusionPointCost: 0
                            })
                        }).done(function () {
                            $("#addriven-fingerprint").val("");
                            updateInventory();
                        });
                        break;
                    }
                }
            });
        });
    });
}

$("#addriven-fingerprint").on("input", () => {
    $("#addriven-fingerprint").removeClass("is-invalid");
});

function setFingerprint(ItemType, ItemId, fingerprint) {
    revalidateAuthz().then(() => {
        $.post({
            url: "/api/artifacts.php?" + window.authz + "&ignoreBuildLabel=1",
            contentType: "text/plain",
            data: JSON.stringify({
                Upgrade: {
                    ItemType,
                    ItemId,
                    UpgradeFingerprint: JSON.stringify(fingerprint)
                },
                LevelDiff: 0,
                Cost: 0,
                FusionPointCost: 0
            })
        }).done(function () {
            updateInventory();
        });
    });
}

function doAcquireMod() {
    const maxed = !!window.maxed;
    window.maxed = false;
    const uniqueName = getKey(document.getElementById("mod-to-acquire"));
    if (!uniqueName) {
        $("#mod-to-acquire").addClass("is-invalid").focus();
        return;
    }
    const count = parseInt($("#mod-count").val());
    if (count != 0 && !Number.isNaN(count)) {
        Promise.all([window.itemListPromise, revalidateAuthz()]).then(([itemList]) => {
            $.post({
                url: "/custom/addItems?" + window.authz,
                contentType: "application/json",
                data: JSON.stringify([
                    {
                        ItemType: uniqueName,
                        ItemCount: count,
                        Fingerprint:
                            maxed && (itemList[uniqueName].fusionLimit ?? 5) > 0
                                ? JSON.stringify({ lvl: itemList[uniqueName].fusionLimit ?? 5 })
                                : undefined
                    }
                ])
            })
                .done(function () {
                    if (count > 0) {
                        toast(loc("code_succAdded"));
                    } else {
                        toast(loc("code_succRemoved"));
                    }
                    updateInventory();
                })
                .fail(r => {
                    toast(r.responseText);
                });
        });
    }
}

function doAcquireModMax() {
    const uniqueName = getKey(document.getElementById("mod-to-acquire"));
    alert("doAcquireModMax: " + uniqueName);
}

// Cheats route

const uiConfigs = [...$(".config-form input[id], .config-form select[id]")].map(x => x.id);

for (const id of uiConfigs) {
    const elm = document.getElementById(id);
    if (elm.tagName == "SELECT") {
        elm.onchange = function () {
            let value = this.value;
            if (value == "true") {
                value = true;
            } else if (value == "false") {
                value = false;
            } else if (value == "null") {
                value = null;
            } else if (!isNaN(parseInt(value))) {
                value = parseInt(value);
            }
            $.post({
                url: "/custom/setConfig?" + window.authz,
                contentType: "application/json",
                data: JSON.stringify({ [id]: value })
            });
        };
    } else if (elm.type == "checkbox") {
        elm.onchange = function () {
            $.post({
                url: "/custom/setConfig?" + window.authz,
                contentType: "application/json",
                data: JSON.stringify({ [id]: this.checked })
            });
        };
    }
}

document.querySelectorAll(".config-form .input-group").forEach(grp => {
    const input = grp.querySelector("input");
    const btn = grp.querySelector("button");
    input.oninput = input.onchange = function () {
        btn.classList.remove("btn-secondary");
        btn.classList.add("btn-primary");
    };
    btn.onclick = function () {
        btn.classList.remove("btn-primary");
        btn.classList.add("btn-secondary");
    };
});

function doSaveConfigInt(id) {
    $.post({
        url: "/custom/setConfig?" + window.authz,
        contentType: "application/json",
        data: JSON.stringify({
            [id]: parseInt(document.getElementById(id).value)
        })
    });
}

function doSaveConfigFloat(id) {
    $.post({
        url: "/custom/setConfig?" + window.authz,
        contentType: "application/json",
        data: JSON.stringify({
            [id]: parseFloat(document.getElementById(id).value)
        })
    });
}

function doSaveConfigStringArray(id) {
    $.post({
        url: "/custom/setConfig?" + window.authz,
        contentType: "application/json",
        data: JSON.stringify({
            [id]: document
                .getElementById(id)
                .getAttribute("data-tags-value")
                .split(", ")
                .filter(x => x)
        })
    });
}

single.getRoute("/webui/cheats").on("beforeload", function () {
    let interval;
    interval = setInterval(() => {
        if (window.authz) {
            clearInterval(interval);
            $.post({
                url: "/custom/getConfig?" + window.authz,
                contentType: "application/json",
                data: JSON.stringify(uiConfigs)
            })
                .done(json => {
                    //window.is_admin = true;
                    $(".config-admin-hide").addClass("d-none");
                    $(".config-admin-show").removeClass("d-none");
                    Object.entries(json).forEach(entry => {
                        const [key, value] = entry;
                        const elm = document.getElementById(key);
                        if (elm.type == "checkbox") {
                            elm.checked = value;
                        } else if (elm.classList.contains("tags-input")) {
                            elm.value = (value ?? []).join(", ");
                            elm.oninput();
                        } else {
                            elm.value = value ?? elm.getAttribute("data-default");
                        }
                    });
                })
                .fail(res => {
                    if (res.responseText == "Log-in expired") {
                        if (ws_is_open && !auth_pending) {
                            console.warn("Credentials invalidated but the server didn't let us know");
                            sendAuth();
                        }
                        revalidateAuthz().then(() => {
                            if (single.getCurrentPath() == "/webui/cheats") {
                                single.loadRoute("/webui/cheats");
                            }
                        });
                    } else {
                        //window.is_admin = false;
                        $(".config-admin-hide").removeClass("d-none");
                        $(".config-admin-show").addClass("d-none");
                    }
                });
        }
    }, 10);
});

function doUnlockAllFocusSchools() {
    revalidateAuthz().then(() => {
        getInventoryData().then(async data => {
            const missingFocusUpgrades = {
                "/Lotus/Upgrades/Focus/Attack/AttackFocusAbility": true,
                "/Lotus/Upgrades/Focus/Tactic/TacticFocusAbility": true,
                "/Lotus/Upgrades/Focus/Ward/WardFocusAbility": true,
                "/Lotus/Upgrades/Focus/Defense/DefenseFocusAbility": true,
                "/Lotus/Upgrades/Focus/Power/PowerFocusAbility": true
            };
            if (data.FocusUpgrades) {
                for (const focusUpgrade of data.FocusUpgrades) {
                    if (focusUpgrade.ItemType in missingFocusUpgrades) {
                        delete missingFocusUpgrades[focusUpgrade.ItemType];
                    }
                }
            }
            for (const upgradeType of Object.keys(missingFocusUpgrades)) {
                await unlockFocusSchool(upgradeType);
            }
            if (Object.keys(missingFocusUpgrades).length == 0) {
                toast(loc("code_focusAllUnlocked"));
            } else {
                toast(loc("code_focusUnlocked").split("|COUNT|").join(Object.keys(missingFocusUpgrades).length));
                if (ws_is_open) {
                    window.ws.send(JSON.stringify({ sync_inventory: true }));
                }
            }
        });
    });
}

function unlockFocusSchool(upgradeType) {
    return new Promise(resolve => {
        // Deselect current FocusAbility so we will be able to unlock the way for free
        $.post({
            url: "/api/focus.php?" + window.authz + "&op=ActivateWay",
            contentType: "text/plain",
            data: JSON.stringify({ FocusType: null })
        }).done(function () {
            // Unlock the way now
            $.post({
                url: "/api/focus.php?" + window.authz + "&op=UnlockWay",
                contentType: "text/plain",
                data: JSON.stringify({
                    FocusType: upgradeType
                })
            }).done(function () {
                resolve();
            });
        });
    });
}

function doHelminthUnlockAll() {
    revalidateAuthz().then(() => {
        $.post("/api/infestedFoundry.php?" + window.authz + "&mode=custom_unlockall");
    });
}

function doIntrinsicsUnlockAll() {
    revalidateAuthz().then(() => {
        $.get("/custom/unlockAllIntrinsics?" + window.authz);
    });
}

document.querySelectorAll("#account-cheats input[type=checkbox]").forEach(elm => {
    elm.onchange = function () {
        revalidateAuthz().then(() => {
            const value = elm.checked;
            $.post({
                url: "/custom/setAccountCheat?" + window.authz,
                contentType: "application/json",
                data: JSON.stringify({
                    key: elm.id,
                    value: value
                })
            }).done(res => {
                elm.checked = value;
                if (res == "retroactivable") {
                    if (window.confirm(loc("cheats_retroactivePrompt"))) {
                        $.get("/custom/retroactivelyApplyCheat?" + window.authz + "&cheat=" + elm.id);
                    }
                }
            });
        });
    };
});

document.querySelectorAll("#account-cheats .input-group").forEach(grp => {
    const input = grp.querySelector("input");
    const select = grp.querySelector("select");
    const btn = grp.querySelector("button");
    if (input) {
        input.oninput = input.onchange = function () {
            btn.classList.remove("btn-secondary");
            btn.classList.add("btn-primary");
        };
    }
    if (select) {
        select.oninput = select.onchange = function () {
            btn.classList.remove("btn-secondary");
            btn.classList.add("btn-primary");
        };
    }
    btn.onclick = function () {
        btn.classList.remove("btn-primary");
        btn.classList.add("btn-secondary");
        const input = btn.closest(".input-group").querySelector('input[type="number"]');
        if (!input) return;
        revalidateAuthz().then(() => {
            const value = input.value;
            $.post({
                url: "/custom/setAccountCheat?" + window.authz,
                contentType: "application/json",
                data: JSON.stringify({
                    key: input.id,
                    value: parseInt(value)
                })
            }).done(() => {
                btn.value = value;
            });
        });
    };
});

document.querySelectorAll("#guild-cheats input[type=checkbox]").forEach(elm => {
    elm.onchange = function () {
        revalidateAuthz().then(() => {
            $.post({
                url: "/custom/setGuildCheat?" + window.authz + "&guildId=" + window.guildId,
                contentType: "application/json",
                data: JSON.stringify({
                    key: elm.id,
                    value: elm.checked
                })
            });
        });
    };
});

// Mods route

function doAddAllMods() {
    let modsAll = new Set();
    for (const child of document.getElementById("datalist-mods").children) {
        modsAll.add(child.getAttribute("data-key"));
    }
    modsAll.delete("/Lotus/Upgrades/Mods/Fusers/CommonModFuser");
    modsAll.delete("/Lotus/Upgrades/Mods/Fusers/UncommonModFuser");
    modsAll.delete("/Lotus/Upgrades/Mods/Fusers/RareModFuser");
    modsAll.delete("/Lotus/Upgrades/Mods/Fusers/LegendaryModFuser");

    revalidateAuthz().then(() => {
        getInventoryData().then(data => {
            for (const modOwned of data.RawUpgrades) {
                if ((modOwned.ItemCount ?? 1) > 0) {
                    modsAll.delete(modOwned.ItemType);
                }
            }

            modsAll = Array.from(modsAll);
            if (
                modsAll.length != 0 &&
                window.confirm(loc("code_addModsConfirm").split("|COUNT|").join(modsAll.length))
            ) {
                $.post({
                    url: "/custom/addItems?" + window.authz,
                    contentType: "application/json",
                    data: JSON.stringify(
                        modsAll.map(mod => ({
                            ItemType: mod,
                            ItemCount: 21 // To fully upgrade certain arcanes
                        }))
                    )
                }).done(function () {
                    updateInventory();
                });
            }
        });
    });
}

function doRemoveUnrankedMods() {
    revalidateAuthz().then(() => {
        getInventoryData().then(data => {
            window.itemListPromise.then(itemMap => {
                $.post({
                    url: "/api/sell.php?" + window.authz,
                    contentType: "text/plain",
                    data: JSON.stringify({
                        SellCurrency: "SC_RegularCredits",
                        SellPrice: 0,
                        Items: {
                            Upgrades: inventory.RawUpgrades.filter(
                                x => !itemMap[x.ItemType]?.parazon && x.ItemCount > 0
                            ).map(x => ({ String: x.ItemType, Count: x.ItemCount }))
                        }
                    })
                }).done(function () {
                    updateInventory();
                });
            });
        });
    });
}

function doAddMissingMaxRankMods() {
    revalidateAuthz().then(() => {
        fetch("/custom/addMissingMaxRankMods?" + window.authz).then(() => {
            updateInventory();
        });
    });
}

// DetailedView Route

single.getRoute("#detailedView-route").on("beforeload", function () {
    document.getElementById("detailedView-loading").classList.remove("d-none");
    document.getElementById("detailedView-title").textContent = "";
    document.querySelector("#detailedView-route .text-body-secondary").textContent = "";
    document.getElementById("loadout-card").classList.add("d-none");
    document.getElementById("archonShards-card").classList.add("d-none");
    document.getElementById("edit-suit-invigorations-card").classList.add("d-none");
    document.getElementById("umbraEchoes-card").classList.add("d-none");
    document.getElementById("modularParts-card").classList.add("d-none");
    document.getElementById("modularParts-form").innerHTML = "";
    document.getElementById("valenceBonus-card").classList.add("d-none");
    document.getElementById("equipmentFeatures-card").classList.add("d-none");
    document.getElementById("equipmentFeaturesButtons-card").innerHTML = "";
    if (window.didInitialInventoryUpdate) {
        updateInventory();
    }
});

single.getRoute("#guild-route").on("beforeload", function () {
    document.getElementById("guildView-loading").classList.remove("d-none");
    document.getElementById("guildView-na").classList.add("d-none");
    document.getElementById("guildView-naDescription").classList.add("d-none");
    document.getElementById("guildView-title").textContent = "";
    document.getElementById("guildView-tier").textContent = "";
    document.getElementById("guildView-class").textContent = "";
    document.getElementById("vaultRegularCredits-form").classList.add("d-none");
    document.getElementById("vaultPremiumCredits-form").classList.add("d-none");
    document.getElementById("VaultRegularCredits-owned").classList.add("mb-0");
    document.getElementById("VaultPremiumCredits-owned").classList.add("mb-0");
    document.getElementById("TechProjects-list").innerHTML = "";
    document.getElementById("techProjects-form").classList.add("d-none");
    document.getElementById("acquire-type-TechProjects").value = "";
    document.getElementById("VaultDecoRecipes-list").innerHTML = "";
    document.getElementById("vaultDecoRecipes-form").classList.add("d-none");
    document.getElementById("acquire-type-VaultDecoRecipes").value = "";
    document.getElementById("VaultMiscItems-list").innerHTML = "";
    document.getElementById("vaultMiscItems-form").classList.add("d-none");
    document.getElementById("acquire-type-VaultMiscItems").value = "";
    document.getElementById("VaultShipDecorations-list").innerHTML = "";
    document.getElementById("vaultShipDecorations-form").classList.add("d-none");
    document.getElementById("acquire-type-VaultShipDecorations").value = "";
    document.getElementById("Alliance-list").innerHTML = "";
    document.getElementById("guildView-alliance").textContent = "";
    document.getElementById("Members-list").innerHTML = "";
    document.querySelectorAll("#guild-actions button").forEach(btn => {
        btn.disabled = true;
    });
    $("#guild-route > .row").addClass("d-none");
    if (window.didInitialInventoryUpdate) {
        translateInventoryDataToDom();
    }
});

function doPushArchonCrystalUpgrade() {
    const urlParams = new URLSearchParams(window.location.search);
    const uniqueName = getKey(document.querySelector("[list='datalist-archonCrystalUpgrades']"));
    if (!uniqueName) {
        $("[list='datalist-archonCrystalUpgrades']").addClass("is-invalid").focus();
        return;
    }
    revalidateAuthz().then(() => {
        $.get(
            "/custom/pushArchonCrystalUpgrade?" +
                window.authz +
                "&oid=" +
                urlParams.get("itemId") +
                "&type=" +
                uniqueName +
                "&count=" +
                $("#archon-crystal-add-count").val()
        ).done(function () {
            $("[list='datalist-archonCrystalUpgrades']").val("");
            updateInventory();
        });
    });
}

function doPopArchonCrystalUpgrade(type) {
    const urlParams = new URLSearchParams(window.location.search);
    revalidateAuthz().then(() => {
        $.get(
            "/custom/popArchonCrystalUpgrade?" + window.authz + "&oid=" + urlParams.get("itemId") + "&type=" + type
        ).done(function () {
            updateInventory();
        });
    });
}

function doImport() {
    revalidateAuthz().then(() => {
        try {
            $.post({
                url: "/custom/import?" + window.authz,
                contentType: "application/json",
                data: JSON.stringify({
                    inventory: JSON.parse($("#import-inventory").val())
                })
            }).then(function (err) {
                if (err) {
                    toast(err == "noKnownKey" ? loc("code_nothingToDo") : err);
                } else {
                    toast(loc("code_succImport"));
                }
                updateInventory();
            });
        } catch (e) {
            toast(e);
            console.error(e);
        }
    });
}

function doChangeSupportedSyndicate() {
    const uniqueName = document.getElementById("changeSyndicate").value;

    revalidateAuthz().then(() => {
        $.get("/api/setSupportedSyndicate.php?" + window.authz + "&syndicate=" + uniqueName).done(function () {
            updateInventory();
        });
    });
}

function doAddCurrency(currency) {
    revalidateAuthz().then(() => {
        $.post({
            url: "/custom/addCurrency?" + window.authz + "&guildId=" + window.guildId,
            contentType: "application/json",
            data: JSON.stringify({
                currency,
                delta: document.getElementById(currency + "-delta").valueAsNumber
            })
        }).then(function () {
            updateInventory();
        });
    });
}

function doQuestUpdate(operation, itemType) {
    revalidateAuthz().then(() => {
        $.post({
            url: "/custom/manageQuests?" + window.authz + "&operation=" + operation + "&itemType=" + itemType,
            contentType: "application/json"
        }).then(function (didAnything) {
            if (didAnything) {
                updateInventory();
            } else {
                toast(loc("code_nothingToDo"));
            }
        });
    });
}

function doBulkQuestUpdate(operation) {
    revalidateAuthz().then(() => {
        $.post({
            url: "/custom/manageQuests?" + window.authz + "&operation=" + operation,
            contentType: "application/json"
        }).then(function (didAnything) {
            if (didAnything) {
                updateInventory();
            } else {
                toast(loc("code_nothingToDo"));
            }
        });
    });
}

function toast(text, type = "primary") {
    const toast = document.createElement("div");
    toast.className = `toast align-items-center text-bg-${type} border-0`;
    const div = document.createElement("div");
    div.className = "d-flex";
    const body = document.createElement("div");
    body.className = "toast-body";
    body.textContent = text;
    div.appendChild(body);
    const button = document.createElement("button");
    button.className = "btn-close btn-close-white me-2 m-auto";
    button.setAttribute("data-bs-dismiss", "toast");
    div.appendChild(button);
    toast.appendChild(div);
    new bootstrap.Toast(document.querySelector(".toast-container").appendChild(toast)).show();
}

function handleModularSelection(category) {
    const itemType = getKey(document.getElementById("acquire-type-" + category));

    if (webUiModularWeapons.includes(itemType)) {
        doAcquireModularEquipment(category, itemType);
    } else {
        doAcquireEquipment(category);
    }
}
{
    const supportedModularInventoryCategory = ["OperatorAmps", "Melee", "LongGuns", "Pistols", "MoaPets", "KubrowPets"];
    supportedModularInventoryCategory.forEach(inventoryCategory => {
        document.getElementById("acquire-type-" + inventoryCategory).addEventListener("input", function () {
            const modularFields = document.getElementById("modular-" + inventoryCategory);
            const modularFieldsMoa = document.getElementById("modular-MoaPets-Moa");
            const modularFieldsZanuka = document.getElementById("modular-MoaPets-Zanuka");
            const modularFieldsCatbrow = document.getElementById("modular-KubrowPets-Catbrow");
            const modularFieldsKubrow = document.getElementById("modular-KubrowPets-Kubrow");
            const key = getKey(this);

            if (webUiModularWeapons.includes(key)) {
                if (inventoryCategory === "MoaPets") {
                    if (key === "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetPowerSuit") {
                        modularFieldsMoa.classList.add("d-none");
                        modularFieldsZanuka.classList.remove("d-none");
                    } else if (key === "/Lotus/Types/Friendly/Pets/MoaPets/MoaPetPowerSuit") {
                        modularFieldsMoa.classList.remove("d-none");
                        modularFieldsZanuka.classList.add("d-none");
                    }
                } else if (inventoryCategory === "KubrowPets") {
                    if (key.endsWith("InfestedCatbrowPetPowerSuit")) {
                        modularFieldsCatbrow.classList.remove("d-none");
                        modularFieldsKubrow.classList.add("d-none");
                    } else if (key.endsWith("PredatorKubrowPetPowerSuit")) {
                        modularFieldsCatbrow.classList.add("d-none");
                        modularFieldsKubrow.classList.remove("d-none");
                    } else {
                        modularFieldsCatbrow.classList.add("d-none");
                        modularFieldsKubrow.classList.add("d-none");
                    }
                } else {
                    modularFields.classList.remove("d-none");
                }
            } else {
                if (inventoryCategory === "MoaPets") {
                    modularFieldsMoa.classList.add("d-none");
                    modularFieldsZanuka.classList.add("d-none");
                } else if (inventoryCategory === "KubrowPets") {
                    modularFieldsCatbrow.classList.add("d-none");
                    modularFieldsKubrow.classList.add("d-none");
                } else {
                    modularFields.classList.add("d-none");
                }
            }
        });
    });
}

function setBooster(ItemType, ExpiryDate) {
    revalidateAuthz().then(() => {
        $.post({
            url: "/custom/setBooster?" + window.authz,
            contentType: "application/json",
            data: JSON.stringify([
                {
                    ItemType,
                    ExpiryDate
                }
            ])
        }).done(function () {
            updateInventory();
        });
    });
}

function doAcquireBooster() {
    const uniqueName = getKey(document.getElementById("acquire-type-Boosters"));
    if (!uniqueName) {
        $("#acquire-type-Boosters").addClass("is-invalid").focus();
        return;
    }
    setBooster(uniqueName, Math.floor(Date.now() / 1000 + 3 * 24 * 60 * 60));
    document.getElementById("acquire-type-Boosters").value = "";
}

function doChangeBoosterExpiry(ItemType, ExpiryDateInput) {
    const ExpiryDate = Math.floor(new Date(ExpiryDateInput.value).getTime() / 1000);
    if (isNaN(ExpiryDate)) {
        ExpiryDateInput.addClass("is-invalid").focus();
        return;
    }
    setBooster(ItemType, ExpiryDate);
}

function formatDatetime(fmt, date) {
    if (typeof date === "number") date = new Date(date);
    return fmt.replace(/(%[yY]|%m|%[Dd]|%H|%h|%M|%[Ss]|%[Pp])/g, match => {
        switch (match) {
            case "%Y":
                return date.getFullYear().toString();
            case "%y":
                return date.getFullYear().toString().slice(-2);
            case "%m":
                return (date.getMonth() + 1).toString().padStart(2, "0");
            case "%D":
            case "%d":
                return date.getDate().toString().padStart(2, "0");
            case "%H":
                return date.getHours().toString().padStart(2, "0");
            case "%h":
                return (date.getHours() % 12).toString().padStart(2, "0");
            case "%M":
                return date.getMinutes().toString().padStart(2, "0");
            case "%S":
            case "%s":
                return date.getSeconds().toString().padStart(2, "0");
            case "%P":
            case "%p":
                return date.getHours() < 12 ? "am" : "pm";
            default:
                return match;
        }
    });
}

const calls_in_flight = new Set();

async function debounce(func, ...args) {
    if (!func.name) {
        throw new Error(`cannot debounce anonymous functions`);
    }
    const callid = JSON.stringify({ func: func.name, args });
    if (!calls_in_flight.has(callid)) {
        calls_in_flight.add(callid);
        await func(...args);
        calls_in_flight.delete(callid);
    } else {
        console.log("debouncing", callid);
    }
}

async function doMaxPlexus() {
    if ((window.plexus?.xp ?? 0) < 900_000) {
        await addGearExp("CrewShipHarnesses", window.plexus.id, 900_000 - window.plexus.xp);
        window.plexus.xp = 900_000;
        toast(loc("code_succRankUp"));
    } else {
        toast(loc("code_noEquipmentToRankUp"));
    }
}

async function doUnlockAllScans() {
    await revalidateAuthz();
    await fetch("/custom/unlockAllScans?" + window.authz);
    toast(loc("cheats_unlockSuccRelog"));
}

async function doUnlockAllShipFeatures() {
    await revalidateAuthz();
    await fetch("/custom/unlockAllShipFeatures?" + window.authz);
    toast(loc(window.have_game_ws ? "code_succAdded" : "cheats_unlockSuccInventory"));
}

async function doUnlockAllCapturaScenes() {
    await revalidateAuthz();
    await fetch("/custom/unlockAllCapturaScenes?" + window.authz);
    toast(loc(window.have_game_ws ? "code_succAdded" : "cheats_unlockSuccInventory"));
}

async function unlockAllMissions() {
    await revalidateAuthz();
    await fetch("/custom/completeAllMissions?" + window.authz);
    toast(loc("cheats_unlockAllMissions_ok"));
}

async function unlockAllJobChainBounties() {
    await revalidateAuthz();
    await fetch("/custom/unlockAllJobChainBounties?" + window.authz);
    toast(loc(window.have_game_ws ? "code_succAdded" : "cheats_unlockSuccInventory"));
}

async function unlockAllSimarisResearchEntries() {
    await revalidateAuthz();
    await fetch("/custom/unlockAllSimarisResearchEntries?" + window.authz);
    toast(loc(window.have_game_ws ? "code_succAdded" : "cheats_unlockSuccInventory"));
}

const importSamples = {
    maxFocus: {
        FocusUpgrades: [
            {
                ItemType: "/Lotus/Upgrades/Focus/Attack/AttackFocusAbility"
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Attack/Stats/MoreAmmoFocusUpgrade",
                Level: 3,
                IsUniversal: true
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Attack/Residual/PowerSnapFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Attack/Residual/PhysicalDamageFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Attack/Active/CloakAttackChargeFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Attack/Stats/RegenAmmoFocusUpgrade",
                Level: 3,
                IsUniversal: true
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Tactic/TacticFocusAbility"
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Ward/WardFocusAbility"
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Defense/DefenseFocusAbility"
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Power/PowerFocusAbility"
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Ward/Active/KnockdownImmunityFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Ward/Active/UnairuWispFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Ward/Active/SunderingDissipationUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Ward/Active/MagneticExtensionUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Ward/Active/MagneticFieldFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Ward/Residual/ArmourBuffFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Ward/Active/ClearStaticOnKillFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Ward/Residual/SecondChanceDamageBuffFocusUpgrade",
                Level: 3,
                IsUniversal: true
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Ward/Residual/SecondChanceFocusUpgrade",
                Level: 3,
                IsUniversal: true
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Ward/Active/InvulnerableReturnFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Attack/Active/ConsecutivePowerUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Attack/Active/AttackEfficiencyFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Attack/Active/GhostlyTouchUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Attack/Active/GhostWaveUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Attack/Active/ConsecutiveEfficienyUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Tactic/Active/ProjectionStretchUpgrade",
                Level: 3,
                IsUniversal: true
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Tactic/Active/ProjectionExecutionUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Tactic/Active/FinisherTransferenceUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Tactic/Active/ComboAmpDamageFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Tactic/Residual/MeleeComboFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Tactic/Residual/MeleeXpFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Tactic/Active/LiftHitWaveUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Tactic/Active/LiftHitDamageUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Tactic/Stats/MoveSpeedFocusUpgrade",
                Level: 3,
                IsUniversal: true
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Tactic/Active/SlamComboFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Power/Active/PowerFieldFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Power/Active/DisarmedEnergyUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Power/Stats/EnergyPoolFocusUpgrade",
                Level: 3,
                IsUniversal: true
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Power/Residual/EnergyOverTimeFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Power/Active/BlastSlowFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Power/Stats/EnergyRestoreFocusUpgrade",
                Level: 3,
                IsUniversal: true
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Power/Residual/FreeAbilityCastsFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Power/Active/DisarmingProjectionUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Power/Residual/SlowHeadshotDamageFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Power/Active/DashBubbleFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Defense/Stats/HealthRegenFocusUpgrade",
                Level: 3,
                IsUniversal: true
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Defense/Residual/RadialXpFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Defense/Active/DefenseShieldFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Defense/Active/CloakHealFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Defense/Active/DefenseShieldBreakFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Defense/Active/DashImmunityFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Defense/Residual/InstantReviveFocusUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Defense/Active/SonicDissipationUpgrade",
                Level: 3
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Defense/Stats/HealthMaxFocusUpgrade",
                Level: 3,
                IsUniversal: true
            },
            {
                ItemType: "/Lotus/Upgrades/Focus/Defense/Active/CloakHealOthersFocusUpgrade",
                Level: 3
            }
        ]
    },
    accolades: {
        Staff: false,
        Founder: 4,
        Guide: 2,
        Moderator: true,
        Partner: true,
        Created: {
            $date: {
                $numberLong: "1356998400000"
            }
        },
        Accolades: {
            Heirloom: true
        },
        Counselor: true
    },
    maxStratos: {
        BountyScore: 39
    },
    clearWishlist: {
        Wishlist: []
    },
    clearLocPins: {
        CustomMarkers: []
    }
};
function setImportSample(key) {
    $("#import-inventory").val(JSON.stringify(importSamples[key], null, 2));
}

document.querySelectorAll(".tags-input").forEach(input => {
    const datalist = document.getElementById(input.getAttribute("list"));
    const options = [...datalist.querySelectorAll("option")].map(x => x.textContent);
    input.oninput = function () {
        const value = [];
        for (const tag of this.value.split(",")) {
            const index = options.map(x => x.toLowerCase()).indexOf(tag.trim().toLowerCase());
            if (index != -1) {
                value.push(options[index]);
            }
        }

        this.setAttribute("data-tags-value", value.join(", "));

        datalist.innerHTML = "";
        for (const option of options) {
            const elm = document.createElement("option");
            elm.textContent = [...value, option, ""].join(", ");
            datalist.appendChild(elm);
        }
    };
    input.oninput();
});

function fromUpdradeFingerPrintVaule(raw, min) {
    const range = 0.6 - min;
    return min + (raw * range) / 0x3fffffff;
}

function toUpdradeFingerPrintVaule(value, min) {
    const range = 0.6 - min;
    return Math.trunc(((value - min) * 0x3fffffff) / range);
}

function handleValenceBonusChange(event) {
    event.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    const action = event.submitter.value;
    const Tag = document.getElementById("valenceBonus-innateDamage").value;
    const Value = toUpdradeFingerPrintVaule(document.getElementById("valenceBonus-procent").value / 100, 0.25);
    revalidateAuthz().then(() => {
        $.post({
            url: "/custom/updateFingerprint?" + window.authz,
            contentType: "application/json",
            data: JSON.stringify({
                category: urlParams.get("productCategory"),
                oid: urlParams.get("itemId"),
                action,
                upgradeType: "/Lotus/Weapons/Grineer/KuvaLich/Upgrades/InnateDamageRandomMod",
                upgradeFingerprint: {
                    buffs: [
                        {
                            Tag,
                            Value
                        }
                    ]
                }
            })
        }).done(function () {
            updateInventory();
        });
    });
}

document.querySelectorAll("#sidebar .nav-link").forEach(function (elm) {
    elm.addEventListener("click", function () {
        window.scrollTo(0, 0);
    });
});

async function markAllAsRead() {
    await revalidateAuthz();
    const { Inbox } = await fetch("/api/inbox.php?" + window.authz).then(x => x.json());
    let any = false;
    for (const msg of Inbox) {
        if (!msg.r) {
            await fetch("/api/inbox.php?" + window.authz + "&messageId=" + msg.messageId.$oid);
            any = true;
        }
    }
    toast(loc(any ? "code_succRelog" : "code_nothingToDo"));
}

function handleModularPartsChange(event) {
    event.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    const form = document.getElementById("modularParts-form");
    const inputs = form.querySelectorAll("input");
    const modularParts = [];
    inputs.forEach(input => {
        const key = getKey(input);
        if (!key) {
            input.classList.add("is-invalid");
        } else {
            modularParts.push(key);
        }
    });

    if (inputs.length == modularParts.length) {
        revalidateAuthz().then(() => {
            $.post({
                url: "/custom/changeModularParts?" + window.authz,
                contentType: "application/json",
                data: JSON.stringify({
                    category: urlParams.get("productCategory"),
                    oid: urlParams.get("itemId"),
                    modularParts
                })
            }).then(function () {
                toast(loc("code_succChange"));
                updateInventory();
            });
        });
    }
}

function submitInvigoration(event) {
    event.preventDefault();
    const OffensiveUpgrade = document.getElementById("invigoration-offensive").value;
    const DefensiveUpgrade = document.getElementById("invigoration-defensive").value;
    const expiry = document.getElementById("invigoration-expiry").value;

    if (!OffensiveUpgrade || !DefensiveUpgrade) {
        toast(loc("code_requiredInvigorationUpgrade"), "warning");
        return;
    }

    setInvigoration({
        OffensiveUpgrade,
        DefensiveUpgrade,
        UpgradesExpiry: expiry ? new Date(expiry).getTime() : Date.now() + 7 * 24 * 60 * 60 * 1000
    });
}

function setInvigoration(data) {
    const oid = new URLSearchParams(window.location.search).get("itemId");
    $.post({
        url: "/custom/setInvigoration?" + window.authz,
        contentType: "application/json",
        data: JSON.stringify({ oid, ...data })
    }).done(function () {
        updateInventory();
    });
}

function submitUmbraEchoes(event) {
    event.preventDefault();
    const expiry = document.getElementById("umbraEchoes-expiry").value;
    setUmbraEchoes({
        UmbraDate: expiry ? new Date(expiry).getTime() : Date.now() + 1 * 24 * 60 * 60 * 1000
    });
}

function setUmbraEchoes(data) {
    const oid = new URLSearchParams(window.location.search).get("itemId");
    $.post({
        url: "/custom/setUmbraEchoes?" + window.authz,
        contentType: "application/json",
        data: JSON.stringify({ oid, ...data })
    }).done(function () {
        updateInventory();
    });
}

function handleAbilityOverride(event, configIndex) {
    event.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    const action = event.submitter.value;
    const Ability = getKey(document.getElementById(`abilityOverride-ability-config-${configIndex}`));
    const Index = document.getElementById(`abilityOverride-ability-index-config-${configIndex}`).value;
    revalidateAuthz().then(() => {
        $.post({
            url: "/custom/abilityOverride?" + window.authz,
            contentType: "application/json",
            data: JSON.stringify({
                category: urlParams.get("productCategory"),
                oid: urlParams.get("itemId"),
                configIndex,
                action,
                AbilityOverride: {
                    Ability,
                    Index
                }
            })
        }).done(function () {
            updateInventory();
        });
    });
}
