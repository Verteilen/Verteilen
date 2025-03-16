const Path = require('path');
const Chalk = require('chalk');
const compileTs = require('./private/tsc');
const { copyFile, mkdir } = require('fs/promises');
const { writeFile } = require('fs/promises');
const pkg = require('pkg');

function buildNode() {
    const nodePath = Path.join(__dirname, '..', 'src', 'node');
    return compileTs(nodePath);
}

function copyPackageJson() {
    const from = Path.join(__dirname, '..', 'node_package.json');
    const to = Path.join(__dirname, '..', 'build', 'node', 'package.json');
    return copyFile(from, to)
}

buildNode().then(() => {
    const exePath = Path.join(__dirname, '..', 'bin', 'worker.exe');
    const endProgramFolderPath = Path.join(__dirname, '..', 'build', 'node', 'bin');
    const endProgramPath = Path.join(endProgramFolderPath, 'worker.exe');
    mkdir(endProgramFolderPath).then(() => {
        copyFile(exePath, endProgramPath)
    })
    copyPackageJson().then(() => {
        writeFile(Path.join(__dirname, '..', 'build', 'node', 'run.sh'), '#!/bin/bash\n\nnode .\nread -p "Press enter to continue"')
        console.log(Chalk.greenBright('Node successfully transpiled!'));
    }).catch(err => console.error(err))
}).catch(err => console.error(err))