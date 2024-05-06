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

const req = $.get("/custom/getItemLists");
req.done(data => {
    for (const [type, items] of Object.entries(data)) {
        items.forEach(item => {
            const option = document.createElement("option");
            option.setAttribute("data-key", item.uniqueName);
            option.value = item.name;
            document.getElementById("datalist-" + type).appendChild(option);
        });
    }
});

function getKey(input) {
    return document
        .getElementById(input.getAttribute("list"))
        .querySelector("[value='" + input.value.split("'").join("\\'") + "']")
        ?.getAttribute("data-key");
}

function doAcquireWarframe() {
    const uniqueName = getKey(document.getElementById("warframe-to-acquire"));
    if (!uniqueName) {
        $("#warframe-to-acquire").addClass("is-invalid");
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
        alert("Warframe added to your inventory! Visit navigation to force an inventory update.");
    });
}

$("#warframe-to-acquire").on("input", () => {
    $("#warframe-to-acquire").removeClass("is-invalid");
});

function doAcquireWeapon() {
    const uniqueName = getKey(document.getElementById("weapon-to-acquire"));
    if (!uniqueName) {
        $("#weapon-to-acquire").addClass("is-invalid");
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
        alert("Weapon added to your inventory! Visit navigation to force an inventory update.");
    });
}

$("#weapon-to-acquire").on("input", () => {
    $("#weapon-to-acquire").removeClass("is-invalid");
});
