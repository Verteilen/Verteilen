import Chalk from 'chalk';
import * as util from './utility';

async function main(){
    await util.Share_Call()
    await util.Build_Program().catch(err => console.error(err))
    await util.PKG_Program().catch(err => console.error(err))
    console.log(Chalk.greenBright('Program successfully transpiled!'));
}

if (require.main === module) {
    main();
}