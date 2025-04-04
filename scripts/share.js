const Path = require('path');
const Chalk = require('chalk');
const FileSystem = require('fs');

const dirs = ["main", "node", "renderer", "server", "program"]
const files = FileSystem.readdirSync(Path.join(__dirname, "..", "src", "share"))

files.forEach(x => {
    if(x == "tsconfig.json") return
    dirs.forEach(y => {
        FileSystem.cpSync(
            Path.join(__dirname, "..", "src", "share", x),
            Path.join(__dirname, "..", "src", y, x),
            { recursive: true }
        )
    })
})

console.log(Chalk.greenBright("Sync share files done !"))