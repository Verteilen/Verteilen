const Path = require('path');
const Chalk = require('chalk');
const FileSystem = require('fs');

const dirs = ["main", "node", "renderer", "server", "program"]
const clients = ["client", "interface", "lan", "plugins", "script", "interface.ts"]
const files = FileSystem.readdirSync(Path.join(__dirname, "..", "src", "share"))

const copyToWhere = (index) => {
    switch(index){
        case 0: // client
            return [0, 1, 3, 4]
        case 1: // interface
            return [0, 1, 2, 3, 4]
        case 5: // interface.ts
            return [0, 1, 2, 3, 4]
        case 2: // lan
            return [0, 1, 2, 3, 4]
        case 3: // plugins
            return [0, 1, 2, 3, 4]
        case 4: // script
            return [2, 3]
    }
}

files.forEach(x => {
    if(x == "tsconfig.json") return
    const index = clients.findIndex(y => y == x)
    const r = copyToWhere(index)
    r.forEach(rs => {
        const y = dirs[rs]
        FileSystem.cpSync(
            Path.join(__dirname, "..", "src", "share", x),
            Path.join(__dirname, "..", "src", y, x),
            { recursive: true }
        )
    })
})

console.log(Chalk.greenBright("Sync share files done !"))