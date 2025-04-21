import Chalk from 'chalk';
import * as util from './utility';

async function main(){
    await util.Copy_Render2Server_DEV()
    console.log(Chalk.greenBright("Express files copy done !"))
}

if (require.main === module) {
    main();
}

