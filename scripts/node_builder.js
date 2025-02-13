const Path = require('path');
const Chalk = require('chalk');
const compileTs = require('./private/tsc');

function buildNode() {
    const nodePath = Path.join(__dirname, '..', 'src', 'node');
    return compileTs(nodePath);
}

Promise.allSettled([
    buildNode(),
]).then(() => {
    console.log(Chalk.greenBright('Node successfully transpiled!'));
});