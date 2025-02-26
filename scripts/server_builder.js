const Path = require('path');
const Chalk = require('chalk');
const compileTs = require('./private/tsc');
const { writeFile, copyFile, cp } = require('fs/promises');

function buildNode() {
    const nodePath = Path.join(__dirname, '..', 'src', 'server');
    return compileTs(nodePath);
}

function copyPackageJson() {
    const from = Path.join(__dirname, '..', 'server_package.json');
    const to = Path.join(__dirname, '..', 'build', 'server', 'package.json');
    return copyFile(from, to)
}

function copyRender() {
    const source = Path.join(__dirname, '..', 'build', 'renderer')
    const p = Path.join(__dirname, '..', 'build', 'server', 'public')
    return cp(source, p, { recursive: true })
}

buildNode().then(() => {
    copyPackageJson().then(() => {
        writeFile(Path.join(__dirname, '..', 'build', 'server', 'run.sh'), '#!/bin/bash\n\nnode .\nread -p "Press enter to continue"')
        copyRender().then(() => {
            console.log(Chalk.greenBright('Node successfully transpiled!'));
        })
    }).catch(err => console.error(err))
}).catch(err => console.error(err))