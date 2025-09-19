const Chalk = require('chalk');
import * as util from './utility';

async function main(){
    let arg: undefined | 'docker' | 'package' = undefined
    process.argv.forEach(element => {
        if(element == "docker") arg = 'docker'
        if(element == "package") arg = 'package'
    });

    util.Clean_Cluster()

    await util.Share_Call()

    await util.Build_Cluster()

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