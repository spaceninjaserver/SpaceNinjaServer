function doLogin() {
    localStorage.setItem("email", $("#email").val());
    localStorage.setItem("password", $("#password").val());
    loginFromLocalStorage();
}

function loginFromLocalStorage() {
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
    req.done(data => {
        $("#login-view").addClass("d-none");
        $("#main-view").removeClass("d-none");
        $(".displayname").text(data.DisplayName);
        window.accountId = data.id;
        updateInventory();
    });
    req.fail(() => {
        logout();
        alert("Login failed");
    });
}

function logout() {
    localStorage.removeItem("email");
    localStorage.removeItem("password");
    $("#login-view").removeClass("d-none");
    $("#main-view").addClass("d-none");
}

if (localStorage.getItem("email") && localStorage.getItem("password")) {
    loginFromLocalStorage();
}

window.itemListPromise = new Promise(resolve => {
    const req = $.get("/custom/getItemLists");
    req.done(data => {
        const itemMap = {};
        for (const [type, items] of Object.entries(data)) {
            items.forEach(item => {
                const option = document.createElement("option");
                option.setAttribute("data-key", item.uniqueName);
                option.value = item.name;
                document.getElementById("datalist-" + type).appendChild(option);
                itemMap[item.uniqueName] = { ...item, type };
            });
        }
        resolve(itemMap);
    });
});

function updateInventory() {
    const req = $.get("/api/inventory.php?accountId=" + window.accountId);
    req.done(data => {
        window.itemListPromise.then(itemMap => {
            document.getElementById("warframe-list").innerHTML = "";
            data.Suits.forEach(item => {
                const tr = document.createElement("tr");
                {
                    const td = document.createElement("td");
                    td.textContent = itemMap[item.ItemType].name;
                    tr.appendChild(td);
                }
                {
                    const td = document.createElement("td");
                    td.classList = "text-end";
                    if (item.XP < 1_600_000) {
                        const a = document.createElement("a");
                        a.href = "#";
                        a.onclick = function () {
                            addGearExp("Suits", item.ItemId.$oid, 1_600_000 - item.XP);
                        };
                        a.textContent = "Make Rank 30";
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
                        td.textContent = itemMap[item.ItemType].name;
                        tr.appendChild(td);
                    }
                    {
                        const td = document.createElement("td");
                        td.classList = "text-end";
                        if (item.XP < 800_000) {
                            const a = document.createElement("a");
                            a.href = "#";
                            a.onclick = function () {
                                addGearExp(category, item.ItemId.$oid, 800_000 - item.XP);
                            };
                            a.textContent = "Make Rank 30";
                            td.appendChild(a);
                        }
                        tr.appendChild(td);
                    }
                    document.getElementById("weapon-list").appendChild(tr);
                });
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
    const req = $.post({
        url: "/custom/addItem",
        contentType: "application/json",
        data: JSON.stringify({
            type: "Powersuit",
            internalName: uniqueName,
            accountId: window.accountId
        })
    });
    req.done(() => {
        document.getElementById("warframe-to-acquire").value = "";
        updateInventory();
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
    const req = $.post({
        url: "/custom/addItem",
        contentType: "application/json",
        data: JSON.stringify({
            type: "Weapon",
            internalName: uniqueName,
            accountId: window.accountId
        })
    });
    req.done(() => {
        document.getElementById("weapon-to-acquire").value = "";
        updateInventory();
    });
}

$("#weapon-to-acquire").on("input", () => {
    $("#weapon-to-acquire").removeClass("is-invalid");
});

function addGearExp(category, oid, xp) {
    const data = {
        Missions: {
            Tag: "SolNode0",
            Completes: 0
        }
    };
    data[category] = [
        {
            ItemId: { $oid: oid },
            XP: xp
        }
    ];
    $.post({
        url: "/api/missionInventoryUpdate.php?accountId=" + window.accountId,
        contentType: "text/plain",
        data: JSON.stringify(data)
    }).done(function () {
        updateInventory();
    });
}
