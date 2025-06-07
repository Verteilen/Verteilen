const Chalk = require('chalk');
import * as util from './utility';

async function main() {
    await util.Share_Call()
    await util.Build_Electron()

    await util.Build_Program()
    await util.PKG_Program("-linux")
    
    console.log(Chalk.greenBright('Program successfully transpiled!'));

    await util.Build_Server()
    await util.Copy_PackageJson2Server()
    await util.Copy_Render2Server()
    await util.Copy_Bin2Server()
}

if (require.main === module) {
    main();
}