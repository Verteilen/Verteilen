import Chalk from 'chalk';
import * as util from './utility';

async function main(){
    await util.Share_Call()
    await util.Build_Electron()
    await util.Copy_Render2Server_DEV()

    console.log(Chalk.greenBright("Express files copy done !"))

    await util.Build_Server()
    await util.Copy_PackageJson2Server()
    await util.Copy_Render2Server()
}

if (require.main === module) {
    main();
}

