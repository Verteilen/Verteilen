const Chalk = require('chalk');
import * as util from './utility';

async function main(){
    let arg: undefined | 'docker' | 'package' = undefined
    process.argv.forEach(element => {
        if(element == "docker") arg = 'docker'
        if(element == "package") arg = 'package'
    });

    util.Clean_Node()

    await util.Share_Call()

    await util.Build_Program()
    if(arg != 'package'){
        await util.PKG_Program(arg == 'docker' ? 'linux' : '')
    }
    console.log(Chalk.greenBright('Program successfully transpiled!'));

    await util.Build_Node()
    if(arg != 'package'){
        await util.Copy_Worker2Node()
    }
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