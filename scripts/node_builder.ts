const Chalk = require('chalk');
import * as util from './utility';

async function main(){
    let docker = false
    process.argv.forEach(element => {
        if(element == "docker") docker = true
    });

    util.Clean_Node()

    await util.Share_Call()

    await util.Build_Program()
    await util.PKG_Program("linux")
    console.log(Chalk.greenBright('Program successfully transpiled!'));

    await util.Build_Node()
    await util.Copy_Worker2Node()
    await util.Copy_PackageJson2Node()

    if(process.argv.includes('--pkg')){
        await util.Clean_Node_Build()
        await util.PKG_Node()
        await util.Copy_Worker2NodeBuild()
        await util.Copy_PackageJson2NodeBuild()
    }
}

if (require.main === module) {
    main();
}