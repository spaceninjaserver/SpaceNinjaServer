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

    const thisbuildproc = spawn("npm", ["run", process.versions.bun ? "verify" : "build:dev"], spawnopts);
    const thisbuildstart = Date.now();
    buildproc = thisbuildproc;
    buildproc.on("exit", code => {
        if (buildproc !== thisbuildproc) {
            return;
        }
        buildproc = undefined;
        if (code === 0) {
            console.log(`${process.versions.bun ? "Verified" : "Built"} in ${Date.now() - thisbuildstart} ms`);
            runproc = spawn("npm", ["run", process.versions.bun ? "bun-run" : "start", "--", ...args], spawnopts);
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
