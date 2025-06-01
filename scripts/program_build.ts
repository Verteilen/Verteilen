import Chalk from 'chalk';
import * as util from './utility';

async function main(){
    let platform = ""
    process.argv.forEach(element => {
        if(element == "win") platform = "-win"
        else if(element == "mac") platform = "-mac"
        else if(element == "linux") platform = "-linux"
    });
    await util.Share_Call()
    await util.Build_Program().catch(err => console.error(err))
    await util.PKG_Program(platform).catch(err => console.error(err))
    console.log(Chalk.greenBright('Program successfully transpiled!'));
}

if (require.main === module) {
    main();
}