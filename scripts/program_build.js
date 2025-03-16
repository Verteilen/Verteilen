const Path = require('path');
const Chalk = require('chalk');
const compileTs = require('./private/tsc');
const pkg = require('pkg')

function buildProgram() {
    const programPath = Path.join(__dirname, '..', 'src', 'program');
    return compileTs(programPath);
}


buildProgram().then(() => {
    const exePath = Path.join(__dirname, '..', 'bin', 'worker.exe');
    const programPath = Path.join(__dirname, '..', 'build', 'program', 'worker.js');
    console.log(Chalk.greenBright('Program successfully transpiled!'));
    pkg.exec(["-d", "-t", "node16-x64", "-o", exePath, "--public-packages", "*", programPath])
}).catch(err => console.error(err))