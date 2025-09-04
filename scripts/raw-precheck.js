const [major, minor] = process.versions.node.split(".").map(x => parseInt(x));
if (major > 22 || (major == 22 && minor >= 7)) {
    // ok
} else {
    console.log("Sorry, your Node version is a bit too old for this. You have 2 options:");
    console.log("- Update Node.js.");
    console.log("- Use 'npm run build && npm run start'. Optional libraries must be installed for this.");
    process.exit(1);
}
