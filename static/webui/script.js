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
}

function setActiveLanguage(lang) {
    window.lang = lang;
    const lang_name = document.querySelector("[data-lang=" + lang + "]").textContent;
    document.getElementById("active-lang-name").textContent = lang_name;
    document.querySelector("[data-lang].active").classList.remove("active");
    document.querySelector("[data-lang=" + lang + "]").classList.add("active");

    window.dictPromise = new Promise(resolve => {
        const webui_lang = ["en", "ru", "fr"].indexOf(lang) == -1 ? "en" : lang;
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

            const itemMap = {
                // Generics for rivens
                "/Lotus/Weapons/Tenno/Archwing/Primary/ArchGun": { name: loc("code_archgun") },
                "/Lotus/Weapons/Tenno/Melee/PlayerMeleeWeapon": { name: loc("code_melee") },
                "/Lotus/Weapons/Tenno/Pistol/LotusPistol": { name: loc("code_pistol") },
                "/Lotus/Weapons/Tenno/Rifle/LotusRifle": { name: loc("code_rifle") },
                "/Lotus/Weapons/Tenno/Shotgun/LotusShotgun": { name: loc("code_shotgun") },
                // Modular weapons
                "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimary": { name: loc("code_kitgun") },
                "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryBeam": { name: loc("code_kitgun") },
                "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryLauncher": { name: loc("code_kitgun") },
                "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryShotgun": { name: loc("code_kitgun") },
                "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimarySniper": { name: loc("code_kitgun") },
                "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondary": { name: loc("code_kitgun") },
                "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondaryBeam": { name: loc("code_kitgun") },
                "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondaryShotgun": { name: loc("code_kitgun") },
                "/Lotus/Weapons/Ostron/Melee/LotusModularWeapon": { name: loc("code_zaw") },
                "/Lotus/Weapons/Sentients/OperatorAmplifiers/SentTrainingAmplifier/OperatorTrainingAmpWeapon": {
                    name: loc("code_moteAmp")
                },
                "/Lotus/Weapons/Sentients/OperatorAmplifiers/OperatorAmpWeapon": { name: loc("code_amp") },
                "/Lotus/Weapons/Operator/Pistols/DrifterPistol/DrifterPistolPlayerWeapon": {
                    name: loc("code_sirocco")
                },
                "/Lotus/Types/Vehicles/Hoverboard/HoverboardSuit": { name: loc("code_kdrive") },
                // Missing in data sources
                "/Lotus/Upgrades/Mods/Fusers/LegendaryModFuser": { name: loc("code_legendaryCore") },
                "/Lotus/Upgrades/CosmeticEnhancers/Peculiars/CyoteMod": { name: loc("code_traumaticPeculiar") }
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
                        if (item.uniqueName.substr(0, 18) != "/Lotus/Types/Game/" && item.badReason != "notraw") {
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
                "MechSuits"
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
                                parseInt(fingerprint.rerolls) +
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
                        if (upgrade) {
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
                            if (!batchData["SpecialItems"]) {
                                batchData["SpecialItems"] = [];
                            }
                            for (const exaltedType of itemMap[item.ItemType].exalted) {
                                const exaltedItem = data["SpecialItems"].find(x => x.ItemType == exaltedType);
                                if (exaltedItem) {
                                    const exaltedCap = itemMap[exaltedType]?.type == "weapons" ? 800_000 : 1_600_000;
                                    if (exaltedItem.XP < exaltedCap) {
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

            alert(loc("code_noEquipmentToRankUp"));
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

function doAcquireMiscItems() {
    const data = getKey(document.getElementById("miscitem-type"));
    if (!data) {
        $("#miscitem-type").addClass("is-invalid").focus();
        return;
    }
    const [category, uniqueName] = data.split(":");
    revalidateAuthz(() => {
        $.post({
            url: "/custom/addItems?" + window.authz,
            contentType: "application/json",
            data: JSON.stringify([
                {
                    ItemType: uniqueName,
                    ItemCount: parseInt($("#miscitem-count").val())
                }
            ])
        }).done(function () {
            alert(loc("code_succAdded"));
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
                alert(loc("code_focusAllUnlocked"));
            } else {
                alert(loc("code_focusUnlocked").split("|COUNT|").join(Object.keys(missingFocusUpgrades).length));
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
            alert(loc("code_succImport"));
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
