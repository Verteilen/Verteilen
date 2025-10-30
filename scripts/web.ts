import Chalk from 'chalk';
import * as util from './utility';

async function main(){
    await util.Build_Electron()
    console.log(Chalk.greenBright('Renderer & main successfully transpiled! (ready to be built with electron-builder)'));
}

if (require.main === module) {
    main();
}

