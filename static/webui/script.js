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
            fetchSettings();
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

window.itemListPromise = new Promise(resolve => {
    const req = $.get("/custom/getItemLists");
    req.done(data => {
        const itemMap = {
            // Generics for rivens
            "/Lotus/Weapons/Tenno/Archwing/Primary/ArchGun": { name: "Archgun" },
            "/Lotus/Weapons/Tenno/Melee/PlayerMeleeWeapon": { name: "Melee" },
            "/Lotus/Weapons/Tenno/Pistol/LotusPistol": { name: "Pistol" },
            "/Lotus/Weapons/Tenno/Rifle/LotusRifle": { name: "Rifle" },
            "/Lotus/Weapons/Tenno/Shotgun/LotusShotgun": { name: "Shotgun" },
            "/Lotus/Weapons/Ostron/Melee/LotusModularWeapon": {name: "Zaw"},
            // Missing in data sources
            "/Lotus/Upgrades/CosmeticEnhancers/Peculiars/CyoteMod": { name: "Traumatic Peculiar" }
        };
        for (const [type, items] of Object.entries(data)) {
            if (type != "badItems") {
                items.forEach(item => {
                    if (item.uniqueName in data.badItems) {
                        item.name += " (Imposter)";
                    } else if (
                        item.uniqueName.substr(0, 18) != "/Lotus/Types/Game/" &&
                        item.uniqueName.substr(0, 18) != "/Lotus/StoreItems/"
                    ) {
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

function updateInventory() {
    const req = $.get("/api/inventory.php?" + window.authz);
    req.done(data => {
        window.itemListPromise.then(itemMap => {
            document.getElementById("warframe-list").innerHTML = "";
            data.Suits.forEach(item => {
                const tr = document.createElement("tr");
                {
                    const td = document.createElement("td");
                    td.textContent = itemMap[item.ItemType]?.name ?? item.ItemType;
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
                        };
                        a.textContent = "Make Rank 30";
                        td.appendChild(a);

                        const span = document.createElement("span");
                        span.innerHTML = " &middot; ";
                        td.appendChild(span);
                    }
                    {
                        const a = document.createElement("a");
                        a.href = "#";
                        a.onclick = function (event) {
                            event.preventDefault();
                            disposeOfGear("Suits", item.ItemId.$oid);
                        };
                        a.textContent = "Remove";
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
                            a.textContent = "Make Rank 30";
                            td.appendChild(a);

                            const span = document.createElement("span");
                            span.innerHTML = " &middot; ";
                            td.appendChild(span);
                        }
                        {
                            const a = document.createElement("a");
                            a.href = "#";
                            a.onclick = function (event) {
                                event.preventDefault();
                                disposeOfGear(category, item.ItemId.$oid);
                            };
                            a.textContent = "Remove";
                            td.appendChild(a);
                        }
                        tr.appendChild(td);
                    }
                    document.getElementById("weapon-list").appendChild(tr);
                });
            });

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
                            a.textContent = "View Stats";
                            td.appendChild(a);
                        }
                        {
                            const span = document.createElement("span");
                            span.innerHTML = " &middot; ";
                            td.appendChild(span);
                        }
                        {
                            const a = document.createElement("a");
                            a.href = "#";
                            a.onclick = function (event) {
                                event.preventDefault();
                                disposeOfGear("Upgrades", item.ItemId.$oid);
                            };
                            a.textContent = "Remove";
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
                            a.textContent = "Max Rank";
                            td.appendChild(a);

                            const span = document.createElement("span");
                            span.innerHTML = " &middot; ";
                            td.appendChild(span);
                        }
                        {
                            const a = document.createElement("a");
                            a.href = "#";
                            a.onclick = function (event) {
                                event.preventDefault();
                                disposeOfGear("Upgrades", item.ItemId.$oid);
                            };
                            a.textContent = "Remove";
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
                            a.textContent = "Max Rank";
                            td.appendChild(a);
                        }
                        {
                            const span = document.createElement("span");
                            span.innerHTML = " &middot; ";
                            td.appendChild(span);
                        }
                        {
                            const a = document.createElement("a");
                            a.href = "#";
                            a.onclick = function (event) {
                                event.preventDefault();
                                disposeOfItems("Upgrades", item.ItemType, item.ItemCount);
                            };
                            a.textContent = "Remove";
                            td.appendChild(a);
                        }
                        tr.appendChild(td);
                    }
                    document.getElementById("mods-list").appendChild(tr);
                }
            });
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
    const uniqueName = getKey(document.getElementById("miscitem-type"));
    if (!uniqueName) {
        $("#miscitem-type").addClass("is-invalid").focus();
        return;
    }
    revalidateAuthz(() => {
        $.post({
            url: "/api/missionInventoryUpdate.php?" + window.authz,
            contentType: "text/plain",
            data: JSON.stringify({
                MiscItems: [
                    {
                        ItemType: uniqueName,
                        ItemCount: $("#miscitem-count").val()
                    }
                ]
            })
        }).done(function () {
            alert("Successfully added.");
        });
    });
}

$("#miscitem-name").on("input", () => {
    $("#miscitem-name").removeClass("is-invalid");
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
            $.get("/api/inventory.php?" + window.authz).done(data => {
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

function fetchSettings() {
    fetch("/custom/config")
        .then(response => response.json())
        .then(json =>
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
}

function doChangeSettings() {
    fetch("/custom/config")
        .then(response => response.json())
        .then(json => {
            for (var i in json) {
                var x = document.getElementById(`${i}`);
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
                url: "/custom/config",
                contentType: "text/plain",
                data: JSON.stringify(json, null, 2)
            });
        });
}
