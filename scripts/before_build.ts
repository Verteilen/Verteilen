import * as util from './utility';

export async function main(){
    await util.Share_Call()
    await util.Build_Electron()
    await util.PKG_Program()
}

if (require.main === module) {
    main();
}