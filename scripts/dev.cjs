/* eslint-disable */
const { spawn } = require("child_process");
const chokidar = require("chokidar");
const kill = require("tree-kill");

let secret = "";
for (let i = 0; i != 10; ++i) {
    secret += String.fromCharCode(Math.floor(Math.random() * 26) + 0x41);
}

const args = [...process.argv].splice(2);
args.push("--dev");
args.push("--secret");
args.push(secret);

const cangoraw = (() => {
    if (process.versions.bun) {
        return true;
    }
    const [major, minor] = process.versions.node.split(".").map(x => parseInt(x));
    if (major > 22 || (major == 22 && minor >= 7)) {
        return true;
    }
    return false;
})();

let buildproc, runproc;
const spawnopts = { stdio: "inherit", shell: true };
function run(changedFile) {
    if (changedFile) {
        console.log(`Change to ${changedFile} detected`);
    }

    if (buildproc) {
        kill(buildproc.pid);
        buildproc = undefined;
    }
    if (runproc) {
        kill(runproc.pid);
        runproc = undefined;
    }

    const thisbuildproc = spawn(
        process.versions.bun ? "bun" : "npm",
        ["run", cangoraw ? "verify" : "build:dev"],
        spawnopts
    );
    const thisbuildstart = Date.now();
    buildproc = thisbuildproc;
    buildproc.on("exit", code => {
        if (buildproc !== thisbuildproc) {
            return;
        }
        buildproc = undefined;
        if (code === 0) {
            console.log(`${cangoraw ? "Verified" : "Built"} in ${Date.now() - thisbuildstart} ms`);
            runproc = spawn(
                process.versions.bun ? "bun" : "npm",
                ["run", cangoraw ? (process.versions.bun ? "raw:bun" : "raw") : "start", "--", ...args],
                spawnopts
            );
            runproc.on("exit", () => {
                runproc = undefined;
            });
        }
    });
}

run();
chokidar.watch("src").on("change", run);
chokidar.watch("static/fixed_responses").on("change", run);

chokidar.watch("static/webui").on("change", async () => {
    try {
        await fetch("http://localhost/custom/webuiFileChangeDetected?secret=" + secret);
    } catch (e) {}
});
