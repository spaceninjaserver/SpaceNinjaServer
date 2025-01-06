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
            email: localStorage.getItem("email"),
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
            alert("Your credentials are no longer valid.");
            single.loadRoute("/webui/"); // Show login screen
        }
    );
}

function logout() {
    localStorage.removeItem("email");
    localStorage.removeItem("password");
}

function renameAccount() {
    const newname = window.prompt("What would you like to change your account name to?");
    if (newname) {
        fetch("/custom/renameAccount?" + window.authz + "&newname=" + newname).then(() => {
            $(".displayname").text(newname);
        });
    }
}

function deleteAccount() {
    if (
        window.confirm(
            "Are you sure you want to delete your account " +
                $(".displayname").text() +
                " (" +
                localStorage.getItem("email") +
                ")? This action cannot be undone."
        )
    ) {
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

function setActiveLanguage(lang) {
    window.lang = lang;
    const lang_name = document.querySelector("[data-lang=" + lang + "]").textContent;
    document.getElementById("active-lang-name").textContent = lang_name;
    document.querySelector("[data-lang].active").classList.remove("active");
    document.querySelector("[data-lang=" + lang + "]").classList.add("active");
}
setActiveLanguage(localStorage.getItem("lang") ?? "en");

function setLanguage(lang) {
    setActiveLanguage(lang);
    localStorage.setItem("lang", lang);
    fetchItemList();
    updateInventory();
}

function fetchItemList() {
    window.itemListPromise = new Promise(resolve => {
        const req = $.get("/custom/getItemLists?lang=" + window.lang);
        req.done(data => {
            window.archonCrystalUpgrades = data.archonCrystalUpgrades;

            const itemMap = {
                // Generics for rivens
                "/Lotus/Weapons/Tenno/Archwing/Primary/ArchGun": { name: "Archgun" },
                "/Lotus/Weapons/Tenno/Melee/PlayerMeleeWeapon": { name: "Melee" },
                "/Lotus/Weapons/Tenno/Pistol/LotusPistol": { name: "Pistol" },
                "/Lotus/Weapons/Tenno/Rifle/LotusRifle": { name: "Rifle" },
                "/Lotus/Weapons/Tenno/Shotgun/LotusShotgun": { name: "Shotgun" },
                // Modular weapons
                "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimary": { name: "Kitgun" },
                "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryBeam": { name: "Kitgun" },
                "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryLauncher": { name: "Kitgun" },
                "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimaryShotgun": { name: "Kitgun" },
                "/Lotus/Weapons/SolarisUnited/Primary/LotusModularPrimarySniper": { name: "Kitgun" },
                "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondary": { name: "Kitgun" },
                "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondaryBeam": { name: "Kitgun" },
                "/Lotus/Weapons/SolarisUnited/Secondary/LotusModularSecondaryShotgun": { name: "Kitgun" },
                "/Lotus/Weapons/Ostron/Melee/LotusModularWeapon": { name: "Zaw" },
                // Missing in data sources
                "/Lotus/Upgrades/CosmeticEnhancers/Peculiars/CyoteMod": { name: "Traumatic Peculiar" }
            };
            for (const [type, items] of Object.entries(data)) {
                if (type == "archonCrystalUpgrades") {
                    Object.entries(items).forEach(([uniqueName, name]) => {
                        const option = document.createElement("option");
                        option.setAttribute("data-key", uniqueName);
                        option.value = name;
                        document.getElementById("datalist-" + type).appendChild(option);
                    });
                } else if (type != "badItems") {
                    items.forEach(item => {
                        if (item.uniqueName in data.badItems) {
                            item.name += " (Imposter)";
                        } else if (item.uniqueName.substr(0, 18) != "/Lotus/Types/Game/") {
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
            document.getElementById("warframe-list").innerHTML = "";
            data.Suits.forEach(item => {
                const tr = document.createElement("tr");
                {
                    const td = document.createElement("td");
                    td.textContent = itemMap[item.ItemType]?.name ?? item.ItemType;
                    if (item.ItemName) {
                        td.textContent = item.ItemName + " (" + td.textContent + ")";
                    }
                    tr.appendChild(td);
                }
                {
                    const td = document.createElement("td");
                    td.classList = "text-end";
                    if (item.XP < 1_600_000) {
                        const a = document.createElement("a");
                        a.href = "#";
                        a.onclick = function (event) {
                            event.preventDefault();
                            addGearExp("Suits", item.ItemId.$oid, 1_600_000 - item.XP);
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
                        a.title = "Make Rank 30";
                        a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"/></svg>`;
                        td.appendChild(a);
                    }
                    {
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
                            const name = prompt("Enter new custom name:");
                            if (name !== null) {
                                renameGear("Suits", item.ItemId.$oid, name);
                            }
                        };
                        a.title = "Rename";
                        a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M0 80V229.5c0 17 6.7 33.3 18.7 45.3l176 176c25 25 65.5 25 90.5 0L418.7 317.3c25-25 25-65.5 0-90.5l-176-176c-12-12-28.3-18.7-45.3-18.7H48C21.5 32 0 53.5 0 80zm112 32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg>`;
                        td.appendChild(a);
                    }
                    {
                        const a = document.createElement("a");
                        a.href = "#";
                        a.onclick = function (event) {
                            event.preventDefault();
                            disposeOfGear("Suits", item.ItemId.$oid);
                        };
                        a.title = "Remove";
                        a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>`;
                        td.appendChild(a);
                    }
                    tr.appendChild(td);
                }
                document.getElementById("warframe-list").appendChild(tr);
            });
            document.getElementById("weapon-list").innerHTML = "";
            ["LongGuns", "Pistols", "Melee"].forEach(category => {
                data[category].forEach(item => {
                    const tr = document.createElement("tr");
                    {
                        const td = document.createElement("td");
                        td.textContent = itemMap[item.ItemType]?.name ?? item.ItemType;
                        if (item.ItemName) {
                            td.textContent = item.ItemName + " (" + td.textContent + ")";
                        }
                        tr.appendChild(td);
                    }
                    {
                        const td = document.createElement("td");
                        td.classList = "text-end";
                        if (item.XP < 800_000) {
                            const a = document.createElement("a");
                            a.href = "#";
                            a.onclick = function (event) {
                                event.preventDefault();
                                addGearExp(category, item.ItemId.$oid, 800_000 - item.XP);
                            };
                            a.title = "Make Rank 30";
                            a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"/></svg>`;
                            td.appendChild(a);
                        }
                        {
                            const a = document.createElement("a");
                            a.href = "#";
                            a.onclick = function (event) {
                                event.preventDefault();
                                const name = prompt("Enter new custom name:");
                                if (name !== null) {
                                    renameGear(category, item.ItemId.$oid, name);
                                }
                            };
                            a.title = "Rename";
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
                            a.title = "Remove";
                            a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>`;
                            td.appendChild(a);
                        }
                        tr.appendChild(td);
                    }
                    document.getElementById("weapon-list").appendChild(tr);
                });
            });

            // Populate mods route
            document.getElementById("riven-list").innerHTML = "";
            document.getElementById("mods-list").innerHTML = "";
            data.Upgrades.forEach(item => {
                if (item.ItemType.substr(0, 32) == "/Lotus/Upgrades/Mods/Randomized/") {
                    const rivenType = item.ItemType.substr(32);
                    const fingerprint = JSON.parse(item.UpgradeFingerprint);

                    const tr = document.createElement("tr");
                    {
                        const td = document.createElement("td");
                        td.textContent = itemMap[fingerprint.compat]?.name ?? fingerprint.compat;
                        td.textContent += " " + RivenParser.parseRiven(rivenType, fingerprint, 1).name;
                        td.innerHTML += " <span title='Number of buffs'>▲ " + fingerprint.buffs.length + "</span>";
                        td.innerHTML += " <span title='Number of curses'>▼ " + fingerprint.curses.length + "</span>";
                        td.innerHTML +=
                            " <span title='Number of rerolls'>⟳ " + parseInt(fingerprint.rerolls) + "</span>";
                        tr.appendChild(td);
                    }
                    {
                        const td = document.createElement("td");
                        td.classList = "text-end";
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
                            a.title = "View Stats";
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
                            a.title = "Remove";
                            a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>`;
                            td.appendChild(a);
                        }
                        tr.appendChild(td);
                    }
                    document.getElementById("riven-list").appendChild(tr);
                } else {
                    const tr = document.createElement("tr");
                    const rank = parseInt(JSON.parse(item.UpgradeFingerprint).lvl);
                    const maxRank = itemMap[item.ItemType]?.fusionLimit ?? 5;
                    {
                        const td = document.createElement("td");
                        td.textContent = itemMap[item.ItemType]?.name ?? item.ItemType;
                        td.innerHTML += " <span title='Rank'>★ " + rank + "/" + maxRank + "</span>";
                        tr.appendChild(td);
                    }
                    {
                        const td = document.createElement("td");
                        td.classList = "text-end";
                        if (rank < maxRank) {
                            const a = document.createElement("a");
                            a.href = "#";
                            a.onclick = function (event) {
                                event.preventDefault();
                                setFingerprint(item.ItemType, item.ItemId, { lvl: maxRank });
                            };
                            a.title = "Max Rank";
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
                            a.title = "Remove";
                            a.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>`;
                            td.appendChild(a);
                        }
                        tr.appendChild(td);
                    }
                    document.getElementById("mods-list").appendChild(tr);
                }
            });
            data.RawUpgrades.forEach(item => {
                if (item.ItemCount > 0) {
                    const maxRank = itemMap[item.ItemType]?.fusionLimit ?? 5;
                    const tr = document.createElement("tr");
                    {
                        const td = document.createElement("td");
                        td.textContent = itemMap[item.ItemType]?.name ?? item.ItemType;
                        td.innerHTML += " <span title='Rank'>★ 0/" + maxRank + "</span>";
                        if (item.ItemCount > 1) {
                            td.innerHTML += " <span title='Count'>🗍 " + parseInt(item.ItemCount) + "</span>";
                        }
                        tr.appendChild(td);
                    }
                    {
                        const td = document.createElement("td");
                        td.classList = "text-end";
                        {
                            const a = document.createElement("a");
                            a.href = "#";
                            a.onclick = function (event) {
                                event.preventDefault();
                                setFingerprint(item.ItemType, item.LastAdded, { lvl: maxRank });
                            };
                            a.title = "Max Rank";
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
                            a.title = "Remove";
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
                        uniqueUpgrades[upgrade.UpgradeType] ??= 0;
                        uniqueUpgrades[upgrade.UpgradeType] += 1;
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
                            td.classList = "text-end";
                            {
                                const a = document.createElement("a");
                                a.href = "#";
                                a.onclick = function (event) {
                                    event.preventDefault();
                                    doPopArchonCrystalUpgrade(upgradeType);
                                };
                                a.title = "Remove";
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
        });
    });
}

function getKey(input) {
    return document
        .getElementById(input.getAttribute("list"))
        .querySelector("[value='" + input.value.split("'").join("\\'") + "']")
        ?.getAttribute("data-key");
}

function doAcquireWarframe() {
    const uniqueName = getKey(document.getElementById("warframe-to-acquire"));
    if (!uniqueName) {
        $("#warframe-to-acquire").addClass("is-invalid").focus();
        return;
    }
    revalidateAuthz(() => {
        const req = $.post({
            url: "/custom/addItem?" + window.authz,
            contentType: "application/json",
            data: JSON.stringify({
                type: "Powersuit",
                internalName: uniqueName
            })
        });
        req.done(() => {
            document.getElementById("warframe-to-acquire").value = "";
            updateInventory();
        });
    });
}

$("#warframe-to-acquire").on("input", () => {
    $("#warframe-to-acquire").removeClass("is-invalid");
});

function doAcquireWeapon() {
    const uniqueName = getKey(document.getElementById("weapon-to-acquire"));
    if (!uniqueName) {
        $("#weapon-to-acquire").addClass("is-invalid").focus();
        return;
    }
    revalidateAuthz(() => {
        const req = $.post({
            url: "/custom/addItem?" + window.authz,
            contentType: "application/json",
            data: JSON.stringify({
                type: "Weapon",
                internalName: uniqueName
            })
        });
        req.done(() => {
            document.getElementById("weapon-to-acquire").value = "";
            updateInventory();
        });
    });
}

$("#weapon-to-acquire").on("input", () => {
    $("#weapon-to-acquire").removeClass("is-invalid");
});

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
            url: "/api/missionInventoryUpdate.php?" + window.authz,
            contentType: "text/plain",
            data: JSON.stringify(data)
        }).done(function () {
            if (category != "SpecialItems") {
                updateInventory();
            }
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
            url: "/api/missionInventoryUpdate.php?" + window.authz,
            contentType: "text/plain",
            data: JSON.stringify({
                [category]: [
                    {
                        ItemType: uniqueName,
                        ItemCount: parseInt($("#miscitem-count").val())
                    }
                ]
            })
        }).done(function () {
            alert("Successfully added.");
        });
    });
}

$("#miscitem-type").on("input", () => {
    $("#miscitem-type").removeClass("is-invalid");
});

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
            url: "/api/missionInventoryUpdate.php?" + window.authz,
            contentType: "text/plain",
            data: JSON.stringify({
                RawUpgrades: [
                    {
                        ItemType: uniqueName,
                        ItemCount: 1
                    }
                ]
            })
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
            url: "/api/missionInventoryUpdate.php?" + window.authz,
            contentType: "text/plain",
            data: JSON.stringify({
                RawUpgrades: [
                    {
                        ItemType: uniqueName,
                        ItemCount: 1
                    }
                ]
            })
        }).done(function () {
            document.getElementById("mod-to-acquire").value = "";
            updateInventory();
        });
    });
}

$("#mod-to-acquire").on("input", () => {
    $("#mod-to-acquire").removeClass("is-invalid");
});

const uiConfigs = [
    "autoCreateAccount",
    "skipTutorial",
    "skipAllDialogue",
    "unlockAllScans",
    "unlockAllMissions",
    "unlockAllQuests",
    "completeAllQuests",
    "infiniteCredits",
    "infinitePlatinum",
    "infiniteEndo",
    "infiniteRegalAya",
    "unlockAllShipFeatures",
    "unlockAllShipDecorations",
    "unlockAllFlavourItems",
    "unlockAllSkins",
    "unlockAllCapturaScenes",
    "universalPolarityEverywhere",
    "spoofMasteryRank"
];

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

    fetch("http://localhost:61558/ping", { mode: "no-cors" })
        .then(() => {
            $("#client-cheats-ok").removeClass("d-none");
            $("#client-cheats-nok").addClass("d-none");

            fetch("http://localhost:61558/skip_mission_start_timer")
                .then(res => res.text())
                .then(res => {
                    document.getElementById("skip_mission_start_timer").checked = res == "1";
                });
            document.getElementById("skip_mission_start_timer").onchange = function () {
                fetch("http://localhost:61558/skip_mission_start_timer?" + this.checked);
            };

            fetch("http://localhost:61558/fov_override")
                .then(res => res.text())
                .then(res => {
                    document.getElementById("fov_override").value = parseFloat(res) * 10000;
                });
            document.getElementById("fov_override").oninput = function () {
                fetch("http://localhost:61558/fov_override?" + this.value);
            };
        })
        .catch(function () {
            $("#client-cheats-nok").removeClass("d-none");
            $("#client-cheats-ok").addClass("d-none");
        });
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
                alert("All focus schools are already unlocked.");
            } else {
                alert(
                    "Unlocked " +
                        Object.keys(missingFocusUpgrades).length +
                        " new focus schools! An inventory update will be needed for the changes to be reflected in-game. Visiting the navigation should be the easiest way to trigger that."
                );
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

$("[list='datalist-archonCrystalUpgrades']").on("input", () => {
    $("[list='datalist-archonCrystalUpgrades']").removeClass("is-invalid");
});

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
