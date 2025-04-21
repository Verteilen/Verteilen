const Path = require('path');
const Chalk = require('chalk');
const compileTs = require('./private/tsc');
const { copyFile, mkdir, cp } = require('fs/promises');
const { writeFile } = require('fs/promises');

function buildNode() {
    const nodePath = Path.join(__dirname, '..', 'src', 'node');
    return compileTs(nodePath);
}

function copyPackageJson() {
    const from = Path.join(__dirname, '..', 'node_package.json');
    const to = Path.join(__dirname, '..', 'build', 'node', 'package.json');
    return copyFile(from, to)
}

function copyPlugins() {
    const from = Path.join(__dirname, '..', 'plugins', 'lua-in-js');
    const from2 = Path.join(__dirname, '..', 'plugins', 'luaparse');
    const to = Path.join(__dirname, '..', 'build', 'node', 'plugins', 'lua-in-js');
    const to2 = Path.join(__dirname, '..', 'build', 'node', 'plugins', 'luaparse');
    const cp1 = cp(from, to, {recursive: true})
    const cp2 = cp(from2, to2, {recursive: true})
    return Promise.all([cp1, cp2])
}

buildNode().then(() => {
    const exePath = Path.join(__dirname, '..', 'bin', 'worker.exe');
    const endProgramFolderPath = Path.join(__dirname, '..', 'build', 'node', 'bin');
    const endProgramPath = Path.join(endProgramFolderPath, 'worker.exe');
    mkdir(endProgramFolderPath).then(() => {
        copyFile(exePath, endProgramPath)
        copyPlugins()
    })
    copyPackageJson().then(() => {
        writeFile(Path.join(__dirname, '..', 'build', 'node', 'run.sh'), '#!/bin/bash\n\nnode .\nread -p "Press enter to continue"')
        console.log(Chalk.greenBright('Node successfully transpiled!'));
    }).catch(err => console.error(err))
}).catch(err => console.error(err))