const Path = require('path');
const Chalk = require('chalk');
const FileSystem = require('fs');

FileSystem.cpSync(
    Path.join(__dirname, "..", "build", "renderer"), 
    Path.join(__dirname, "..", "src", "server", "public"), 
    { recursive: true, force: true }
)

console.log(Chalk.greenBright("Express files copy done !"))