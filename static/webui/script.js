function doLogin() {
    localStorage.setItem("email", $("#email").val());
    localStorage.setItem("password", $("#password").val());
    $("#email, #password").val("");
    loginFromLocalStorage();
}

function loginFromLocalStorage() {
    doLoginRequest(
        data => {
            if (single.getCurrentPath() == "/webui/") {
                single.loadRoute("/webui/inventory");
            }
            $(".displayname").text(data.DisplayName);
            window.accountId = data.id;
            window.authz = "accountId=" + data.id + "&nonce=" + data.Nonce;
            if (window.dict) {
                updateLocElements();
            }
            updateInventory();
        },
        () => {
            logout();
            alert("Login failed");
        }
    );
}

function doLoginRequest(succ_cb, fail_cb) {
    const req = $.post({
        url: "/api/login.php",
        contentType: "text/plain",
        data: JSON.stringify({
            email: localStorage.getItem("email").toLowerCase(),
            password: wp.encSync(localStorage.getItem("password"), "hex"),
            time: parseInt(new Date() / 1000),
            s: "W0RFXVN0ZXZlIGxpa2VzIGJpZyBidXR0cw==", // signature of some kind
            lang: "en",
            date: 1501230947855458660, // ???
            ClientType: "webui",
            PS: "W0RFXVN0ZXZlIGxpa2VzIGJpZyBidXR0cw==" // anti-cheat data
        })
    });
    req.done(succ_cb);
    req.fail(fail_cb);
}

function revalidateAuthz(succ_cb) {
    return doLoginRequest(
        data => {
            window.authz = "accountId=" + data.id + "&nonce=" + data.Nonce;
            succ_cb();
        },
        () => {
            logout();
            alert(loc("code_nonValidAuthz"));
            single.loadRoute("/webui/"); // Show login screen
        }
    );
}

function logout() {
    localStorage.removeItem("email");
    localStorage.removeItem("password");
}

function renameAccount() {
    const newname = window.prompt(loc("code_changeNameConfirm"));
    if (newname) {
        fetch("/custom/renameAccount?" + window.authz + "&newname=" + newname).then(() => {
            $(".displayname").text(newname);
            updateLocElements();
        });
    }
}

function deleteAccount() {
    if (window.confirm(loc("code_deleteAccountConfirm"))) {
        fetch("/custom/deleteAccount?" + window.authz).then(() => {
            logout();
            single.loadRoute("/webui/"); // Show login screen
        });
    }
}

if (localStorage.getItem("email") && localStorage.getItem("password")) {
    loginFromLocalStorage();
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

    $(".nav-link").removeClass("active");
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
}

function setActiveLanguage(lang) {
    window.lang = lang;
    const lang_name = document.querySelector("[data-lang=" + lang + "]").textContent;
    document.getElementById("active-lang-name").textContent = lang_name;
    document.querySelector("[data-lang].active").classList.remove("active");
    document.querySelector("[data-lang=" + lang + "]").classList.add("active");

    window.dictPromise = new Promise(resolve => {
        const webui_lang = ["en", "ru", "fr", "de", "zh"].indexOf(lang) == -1 ? "en" : lang;
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

let uniqueLevelCaps = {};
function fetchItemList() {
    window.itemListPromise = new Promise(resolve => {
        const req = $.get("/custom/getItemLists?lang=" + window.lang);
        req.done(async data => {
            await dictPromise;

            document.querySelectorAll('[id^="datalist-"]').forEach(datalist => {
                datalist.innerHTML = "";
            });

            const syndicateNone = document.createElement("option");
            syndicateNone.setAttribute("data-key", "");
            syndicateNone.value = loc("cheats_none");
            document.getElementById("datalist-Syndicates").appendChild(syndicateNone);

            window.archonCrystalUpgrades = data.archonCrystalUpgrades;

            // Add mods mising in data sources
            data.mods.push({
                uniqueName: "/Lotus/Upgrades/Mods/Fusers/LegendaryModFuser",
                name: loc("code_legendaryCore")
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
                    name: loc("code_zanukaA")
                },
                "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetBPowerSuit": {
                    name: loc("code_zanukaB")
                },
                "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetCPowerSuit": {
                    name: loc("code_zanukaC")
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
                } else if (type == "uniqueLevelCaps") {
                    uniqueLevelCaps = items;
                } else {
                    items.forEach(item => {
                        if ("badReason" in item) {
                            if (item.badReason == "starter") {
                                item.name = loc("code_starter").split("|MOD|").join(item.name);
                            } else {
                                item.name += " " + loc("code_badItem");
                            }
                        }
                        if (type == "Syndicates" && item.uniqueName.startsWith("RadioLegion")) {
                            item.name += " (" + item.uniqueName + ")";
                        }
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
                                "LWPT_ZANUKA_TAIL"
                            ];
                            if (supportedModularParts.includes(item.partType)) {
                                const option = document.createElement("option");
                                option.setAttribute("data-key", item.uniqueName);
                                option.value = item.name;
                                document
                                    .getElementById("datalist-" + type + "-" + item.partType.slice(5))
                                    .appendChild(option);
                            } else {
                                console.log(item.partType);
                                const option = document.createElement("option");
                                option.setAttribute("data-key", item.uniqueName);
                                option.value = item.name;
                                document.getElementById("datalist-" + type).appendChild(option);
                            }
                        }
                        if (item.badReason != "notraw") {
                            const option = document.createElement("option");
                            option.setAttribute("data-key", item.uniqueName);
                            option.value = item.name;
                            document.getElementById("datalist-" + type).appendChild(option);
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

function updateInventory() {
    const req = $.get("/api/inventory.php?" + window.authz + "&xpBasedLevelCapDisabled=1");
    req.done(data => {
        window.itemListPromise.then(itemMap => {
            window.didInitialInventoryUpdate = true;

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
                "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetCPowerSuit"
            ];

            // Populate inventory route
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
                "MoaPets"
            ].forEach(category => {
                document.getElementById(category + "-list").innerHTML = "";
                data[category].forEach(item => {
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
                        let maxXP = Math.pow(uniqueLevelCaps[item.ItemType] ?? 30, 2) * 1000;
                        if (
                            category != "Suits" &&
                            category != "SpaceSuits" &&
                            category != "Sentinels" &&
                            category != "Hoverboards" &&
                            category != "MechSuits"
                        ) {
                            maxXP /= 2;
                        }

                        if (item.XP < maxXP) {
                            const a = document.createElement("a");
                            a.href = "#";
                            a.onclick = function (event) {
                                event.preventDefault();
                                addGearExp(category, item.ItemId.$oid, maxXP - item.XP);
                                if ("exalted" in itemMap[item.ItemType]) {
                                    for (const exaltedType of itemMap[item.ItemType].exalted) {
                                        const exaltedItem = data.SpecialItems.find(x => x.ItemType == exaltedType);
                                        if (exaltedItem) {
                                            const exaltedCap =
                                                itemMap[exaltedType]?.type == "weapons" ? 800_000 : 1_600_000;
                                            if (exaltedItem.XP < exaltedCap) {
                                                addGearExp(
                                                    "SpecialItems",
                                                    exaltedItem.ItemId.$oid,
                                                    exaltedCap - exaltedItem.XP
                                                );
                                            }
                                        }
                                    }
                                }
                            };
                            a.title = loc("code_maxRank");
                            a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"/></svg>`;
                            td.appendChild(a);
                        }
                        if (!(item.Features & 8) && modularWeapons.includes(item.ItemType)) {
                            const a = document.createElement("a");
                            a.href = "#";
                            a.onclick = function (event) {
                                event.preventDefault();
                                gildEquipment(category, item.ItemId.$oid);
                            };
                            a.title = loc("code_gild");
                            a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></svg>`;
                            td.appendChild(a);
                        }
                        if (category == "Suits") {
                            const a = document.createElement("a");
                            a.href = "/webui/powersuit/" + item.ItemId.$oid;
                            a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M278.5 215.6L23 471c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l57-57h68c49.7 0 97.9-14.4 139-41c11.1-7.2 5.5-23-7.8-23c-5.1 0-9.2-4.1-9.2-9.2c0-4.1 2.7-7.6 6.5-8.8l81-24.3c2.5-.8 4.8-2.1 6.7-4l22.4-22.4c10.1-10.1 2.9-27.3-11.3-27.3l-32.2 0c-5.1 0-9.2-4.1-9.2-9.2c0-4.1 2.7-7.6 6.5-8.8l112-33.6c4-1.2 7.4-3.9 9.3-7.7C506.4 207.6 512 184.1 512 160c0-41-16.3-80.3-45.3-109.3l-5.5-5.5C432.3 16.3 393 0 352 0s-80.3 16.3-109.3 45.3L139 149C91 197 64 262.1 64 330v55.3L253.6 195.8c6.2-6.2 16.4-6.2 22.6 0c5.4 5.4 6.1 13.6 2.2 19.8z"/></svg>`;
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

            // Populate mods route
            document.getElementById("riven-list").innerHTML = "";
            document.getElementById("mods-list").innerHTML = "";
            data.Upgrades.forEach(item => {
                if (item.ItemType.substr(0, 32) == "/Lotus/Upgrades/Mods/Randomized/") {
                    const rivenType = item.ItemType.substr(32);
                    const fingerprint = JSON.parse(item.UpgradeFingerprint);
                    if (fingerprint.buffs) {
                        // Riven has been revealed?
                        const tr = document.createElement("tr");
                        {
                            const td = document.createElement("td");
                            td.textContent = itemMap[fingerprint.compat]?.name ?? fingerprint.compat;
                            td.textContent += " " + RivenParser.parseRiven(rivenType, fingerprint, 1).name;
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
                    td.innerHTML += " <span title='" + loc("code_rank") + "'>★ " + rank + "/" + maxRank + "</span>";
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
                        td.innerHTML += " <span title='" + loc("code_rank") + "'>★ 0/" + maxRank + "</span>";
                        if (item.ItemCount > 1) {
                            td.innerHTML += " <span title='Count'>🗍 " + parseInt(item.ItemCount) + "</span>";
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

            // Populate powersuit route
            if (single.getCurrentPath().substr(0, 17) == "/webui/powersuit/") {
                const oid = single.getCurrentPath().substr(17);
                const item = data.Suits.find(x => x.ItemId.$oid == oid);
                if (item) {
                    if (item.ItemName) {
                        $("#powersuit-route h3").text(item.ItemName);
                        $("#powersuit-route .text-body-secondary").text(itemMap[item.ItemType]?.name ?? item.ItemType);
                    } else {
                        $("#powersuit-route h3").text(itemMap[item.ItemType]?.name ?? item.ItemType);
                        $("#powersuit-route .text-body-secondary").text("");
                    }

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
                } else {
                    single.loadRoute("/webui/inventory");
                }
            }
            document.getElementById("changeSyndicate").value =
                [...document.querySelectorAll("#datalist-Syndicates option")].find(
                    option => option.getAttribute("data-key") === (data.SupportedSyndicate ?? "")
                )?.value ?? loc("cheats_none");
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
    revalidateAuthz(() => {
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
        req.done(() => {
            document.getElementById("acquire-type-" + category).value = "";
            updateInventory();
        });
    });
}

function doAcquireModularEquipment(category, ItemType) {
    let requiredParts;
    let ModularParts = [];
    switch (category) {
        case "HoverBoards":
            ItemType = "/Lotus/Types/Vehicles/Hoverboard/HoverboardSuit";
            requiredParts = ["HB_DECK", "HB_ENGINE", "HB_FRONT", "HB_JET"];
            break;
        case "OperatorAmps":
            requiredParts = ["AMP_OCULUS", "AMP_CORE", "AMP_BRACE"];
            break;
        case "Melee":
            requiredParts = ["BLADE", "HILT", "HILT_WEIGHT"];
            break;
        case "LongGuns":
            requiredParts = ["GUN_BARREL", "GUN_PRIMARY_HANDLE", "GUN_CLIP"];
            break;
        case "Pistols":
            requiredParts = ["GUN_BARREL", "GUN_SECONDARY_HANDLE", "GUN_CLIP"];
            break;
        case "MoaPets":
            if (ItemType == "/Lotus/Types/Friendly/Pets/MoaPets/MoaPetPowerSuit") {
                requiredParts = ["MOA_ENGINE", "MOA_PAYLOAD", "MOA_HEAD", "MOA_LEG"];
            } else {
                requiredParts = ["ZANUKA_BODY", "ZANUKA_HEAD", "ZANUKA_LEG", "ZANUKA_TAIL"];
            }
            break;
    }
    requiredParts.forEach(part => {
        const partName = getKey(document.getElementById("acquire-type-" + category + "-" + part));
        if (partName) {
            ModularParts.push(partName);
        }
    });
    if (ModularParts.length != requiredParts.length) {
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
        revalidateAuthz(() => {
            const req = $.post({
                url: "/custom/addModularEquipment?" + window.authz,
                contentType: "application/json",
                data: JSON.stringify({
                    ItemType,
                    ModularParts
                })
            });
            req.done(() => {
                const mainInput = document.getElementById("acquire-type-" + category);
                if (mainInput) {
                    mainInput.value = "";
                    document.getElementById("modular-" + category).style.display = "none";
                }
                requiredParts.forEach(part => {
                    document.getElementById("acquire-type-" + category + "-" + part).value = "";
                });
                updateInventory();
            });
        });
    }
}

$("input[list]").on("input", function () {
    $(this).removeClass("is-invalid");
});

function dispatchAddItemsRequestsBatch(requests) {
    revalidateAuthz(() => {
        const req = $.post({
            url: "/custom/addItems?" + window.authz,
            contentType: "application/json",
            data: JSON.stringify(requests)
        });
        req.done(() => {
            updateInventory();
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
                requests.push({ ItemType: elm.getAttribute("data-key"), ItemCount: 1 });
            }
        });
    });
    if (requests.length != 0 && window.confirm(loc("code_addItemsConfirm").split("|COUNT|").join(requests.length))) {
        dispatchAddItemsRequestsBatch(requests);
    }
}

function maxRankAllEquipment(categories) {
    const req = $.get("/api/inventory.php?" + window.authz + "&xpBasedLevelCapDisabled=1");

    req.done(data => {
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
                    if (category === "Suits") {
                        if ("exalted" in itemMap[item.ItemType]) {
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
                    }
                });
            });

            if (Object.keys(batchData).length > 0) {
                return sendBatchGearExp(batchData);
            }

            toast(loc("code_noEquipmentToRankUp"));
        });
    });
}

function addGearExp(category, oid, xp) {
    const data = {};
    data[category] = [
        {
            ItemId: { $oid: oid },
            XP: xp
        }
    ];
    revalidateAuthz(() => {
        $.post({
            url: "/custom/addXp?" + window.authz,
            contentType: "application/json",
            data: JSON.stringify(data)
        }).done(function () {
            if (category != "SpecialItems") {
                updateInventory();
            }
        });
    });
}

function sendBatchGearExp(data) {
    revalidateAuthz(() => {
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
    revalidateAuthz(() => {
        $.post({
            url: "/api/nameWeapon.php?" + window.authz + "&Category=" + category + "&ItemId=" + oid + "&webui=1",
            contentType: "text/plain",
            data: JSON.stringify({
                ItemName: name
            })
        }).done(function () {
            updateInventory();
        });
    });
}

function disposeOfGear(category, oid) {
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
    revalidateAuthz(() => {
        $.post({
            url: "/api/sell.php?" + window.authz,
            contentType: "text/plain",
            data: JSON.stringify(data)
        }).done(function () {
            updateInventory();
        });
    });
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
    revalidateAuthz(() => {
        $.post({
            url: "/api/sell.php?" + window.authz,
            contentType: "text/plain",
            data: JSON.stringify(data)
        }).done(function () {
            updateInventory();
        });
    });
}

function gildEquipment(category, oid) {
    revalidateAuthz(() => {
        $.post({
            url: "/custom/gildEquipment?" + window.authz,
            contentType: "application/json",
            data: JSON.stringify({
                ItemId: oid,
                Category: category
            })
        }).done(function () {
            updateInventory();
        });
    });
}

function doAcquireMiscItems() {
    const uniqueName = getKey(document.getElementById("miscitem-type"));
    if (!uniqueName) {
        $("#miscitem-type").addClass("is-invalid").focus();
        return;
    }
    const count = parseInt($("#miscitem-count").val());
    if (count != 0) {
        revalidateAuthz(() => {
            $.post({
                url: "/custom/addItems?" + window.authz,
                contentType: "application/json",
                data: JSON.stringify([
                    {
                        ItemType: uniqueName,
                        ItemCount: count
                    }
                ])
            }).done(function () {
                if (count > 0) {
                    toast(loc("code_succAdded"));
                } else {
                    toast(loc("code_succRemoved"));
                }
            });
        });
    }
}

function doAcquireRiven() {
    let fingerprint;
    try {
        fingerprint = JSON.parse($("#addriven-fingerprint").val());
        if (typeof fingerprint !== "object") {
            fingerprint = JSON.parse(fingerprint);
        }
    } catch (e) {}
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
    revalidateAuthz(() => {
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
            $.get("/api/inventory.php?" + window.authz + "&xpBasedLevelCapDisabled=1").done(data => {
                for (const rawUpgrade of data.RawUpgrades) {
                    if (rawUpgrade.ItemType === uniqueName) {
                        // Add fingerprint to riven
                        $.post({
                            url: "/api/artifacts.php?" + window.authz,
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
    revalidateAuthz(() => {
        $.post({
            url: "/api/artifacts.php?" + window.authz,
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
    const uniqueName = getKey(document.getElementById("mod-to-acquire"));
    if (!uniqueName) {
        $("#mod-to-acquire").addClass("is-invalid").focus();
        return;
    }
    revalidateAuthz(() => {
        $.post({
            url: "/custom/addItems?" + window.authz,
            contentType: "application/json",
            data: JSON.stringify([
                {
                    ItemType: uniqueName,
                    ItemCount: parseInt($("#mod-count").val())
                }
            ])
        }).done(function () {
            document.getElementById("mod-to-acquire").value = "";
            updateInventory();
        });
    });
}

const uiConfigs = [...$("#server-settings input[id]")].map(x => x.id);

function doChangeSettings() {
    fetch("/custom/config?" + window.authz)
        .then(response => response.json())
        .then(json => {
            for (const i of uiConfigs) {
                var x = document.getElementById(i);
                if (x != null) {
                    if (x.type == "checkbox") {
                        if (x.checked === true) {
                            json[i] = true;
                        } else {
                            json[i] = false;
                        }
                    } else if (x.type == "number") {
                        json[i] = parseInt(x.value);
                    }
                }
            }
            $.post({
                url: "/custom/config?" + window.authz,
                contentType: "text/plain",
                data: JSON.stringify(json, null, 2)
            }).then(() => {
                // A few cheats affect the inventory response which in turn may change what values we need to show
                updateInventory();
            });
        });
}

// Cheats route

single.getRoute("/webui/cheats").on("beforeload", function () {
    let interval;
    interval = setInterval(() => {
        if (window.authz) {
            clearInterval(interval);
            fetch("/custom/config?" + window.authz).then(res => {
                if (res.status == 200) {
                    $("#server-settings-no-perms").addClass("d-none");
                    $("#server-settings").removeClass("d-none");
                    res.json().then(json =>
                        Object.entries(json).forEach(entry => {
                            const [key, value] = entry;
                            var x = document.getElementById(`${key}`);
                            if (x != null) {
                                if (x.type == "checkbox") {
                                    if (value === true) {
                                        x.setAttribute("checked", "checked");
                                    }
                                } else if (x.type == "number") {
                                    x.setAttribute("value", `${value}`);
                                }
                            }
                        })
                    );
                } else {
                    $("#server-settings-no-perms").removeClass("d-none");
                    $("#server-settings").addClass("d-none");
                }
            });
        }
    }, 10);
});

function doUnlockAllFocusSchools() {
    revalidateAuthz(() => {
        $.get("/api/inventory.php?" + window.authz + "&xpBasedLevelCapDisabled=1").done(async data => {
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
            }
        });
    });
}

function unlockFocusSchool(upgradeType) {
    return new Promise(resolve => {
        // Deselect current FocusAbility so we will be able to unlock the way for free
        $.post({
            url: "/api/focus.php?" + window.authz + "&op=5",
            contentType: "text/plain",
            data: "{}"
        }).done(function () {
            // Unlock the way now
            $.post({
                url: "/api/focus.php?" + window.authz + "&op=2",
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
    revalidateAuthz(() => {
        $.post("/api/infestedFoundry.php?" + window.authz + "&mode=custom_unlockall");
    });
}

function doIntrinsicsUnlockAll() {
    revalidateAuthz(() => {
        $.get("/custom/unlockAllIntrinsics?" + window.authz);
    });
}

function doAddAllMods() {
    let modsAll = new Set();
    for (const child of document.getElementById("datalist-mods").children) {
        modsAll.add(child.getAttribute("data-key"));
    }
    modsAll.delete("/Lotus/Upgrades/Mods/Fusers/LegendaryModFuser");

    revalidateAuthz(() => {
        const req = $.get("/api/inventory.php?" + window.authz + "&xpBasedLevelCapDisabled=1");
        req.done(data => {
            for (const modOwned of data.RawUpgrades) {
                if (modOwned.ItemCount ?? 1 > 0) {
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

// Powersuit Route

single.getRoute("#powersuit-route").on("beforeload", function () {
    this.element.querySelector("h3").textContent = "Loading...";
    if (window.didInitialInventoryUpdate) {
        updateInventory();
    }
});

function doPushArchonCrystalUpgrade() {
    const uniqueName = getKey(document.querySelector("[list='datalist-archonCrystalUpgrades']"));
    if (!uniqueName) {
        $("[list='datalist-archonCrystalUpgrades']").addClass("is-invalid").focus();
        return;
    }
    revalidateAuthz(() => {
        $.get(
            "/custom/pushArchonCrystalUpgrade?" +
                window.authz +
                "&oid=" +
                single.getCurrentPath().substr(17) +
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
    revalidateAuthz(() => {
        $.get(
            "/custom/popArchonCrystalUpgrade?" +
                window.authz +
                "&oid=" +
                single.getCurrentPath().substr(17) +
                "&type=" +
                type
        ).done(function () {
            updateInventory();
        });
    });
}

function doImport() {
    revalidateAuthz(() => {
        $.post({
            url: "/custom/import?" + window.authz,
            contentType: "application/json",
            data: JSON.stringify({
                inventory: JSON.parse($("#import-inventory").val())
            })
        }).then(function () {
            toast(loc("code_succImport"));
            updateInventory();
        });
    });
}

function doChangeSupportedSyndicate() {
    const uniqueName = getKey(document.getElementById("changeSyndicate"));

    revalidateAuthz(() => {
        $.get("/api/setSupportedSyndicate.php?" + window.authz + "&syndicate=" + uniqueName).done(function () {
            updateInventory();
        });
    });
}

function doAddCurrency(currency) {
    $.post({
        url: "/custom/addCurrency?" + window.authz,
        contentType: "application/json",
        data: JSON.stringify({
            currency,
            delta: document.getElementById(currency + "-delta").valueAsNumber
        })
    }).then(function () {
        updateInventory();
    });
}

function doQuestUpdate(operation) {
    $.post({
        url: "/custom/manageQuests?" + window.authz + "&operation=" + operation,
        contentType: "application/json"
    }).then(function () {
        updateInventory();
    });
}

function toast(text) {
    const toast = document.createElement("div");
    toast.className = "toast align-items-center text-bg-primary border-0";
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
    const modularWeapons = [
        "/Lotus/Weapons/Sentients/OperatorAmplifiers/OperatorAmpWeapon",
        "/Lotus/Weapons/Ostron/Melee/LotusModularWeapon",
        "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimary",
        "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondary",
        "/Lotus/Types/Friendly/Pets/MoaPets/MoaPetPowerSuit",
        "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetPowerSuit"
    ];
    const itemType = getKey(document.getElementById("acquire-type-" + category));

    if (modularWeapons.includes(itemType)) {
        doAcquireModularEquipment(category, itemType);
    } else {
        doAcquireEquipment(category);
    }
}
{
    const modularWeapons = [
        "/Lotus/Weapons/Sentients/OperatorAmplifiers/OperatorAmpWeapon",
        "/Lotus/Weapons/Ostron/Melee/LotusModularWeapon",
        "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimary",
        "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondary",
        "/Lotus/Types/Friendly/Pets/MoaPets/MoaPetPowerSuit",
        "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetPowerSuit"
    ];
    const supportedModularInventoryCategory = ["OperatorAmps", "Melee", "LongGuns", "Pistols", "MoaPets"];
    supportedModularInventoryCategory.forEach(inventoryCategory => {
        document.getElementById("acquire-type-" + inventoryCategory).addEventListener("input", function () {
            const modularFields = document.getElementById("modular-" + inventoryCategory);
            const modularFieldsZanuka =
                inventoryCategory === "MoaPets"
                    ? document.getElementById("modular-" + inventoryCategory + "-Zanuka")
                    : null;
            const key = getKey(this);

            if (modularWeapons.includes(key)) {
                if (key === "/Lotus/Types/Friendly/Pets/ZanukaPets/ZanukaPetPowerSuit" && modularFieldsZanuka) {
                    modularFields.style.display = "none";
                    modularFieldsZanuka.style.display = "";
                } else if (key === "/Lotus/Types/Friendly/Pets/MoaPets/MoaPetPowerSuit") {
                    modularFields.style.display = "";
                    if (modularFieldsZanuka) {
                        modularFieldsZanuka.style.display = "none";
                    }
                } else {
                    modularFields.style.display = "";
                }
            } else {
                modularFields.style.display = "none";
                if (modularFieldsZanuka) {
                    modularFieldsZanuka.style.display = "none";
                }
            }
        });
    });
}
