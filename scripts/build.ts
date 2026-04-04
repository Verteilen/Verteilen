import Chalk from 'chalk';
import { rmSync } from 'fs';
import { cp, readdir } from 'fs/promises';
import Path from 'path';
import * as Vite from 'vite';

async function buildRenderer() {
    await Vite.build({
        configFile: Path.join(__dirname, '..', 'vite.config.js'),
        base: './',
        mode: 'production'
    });
    const fff = await readdir(Path.join(__dirname, '..', 'src', 'assets'), {withFileTypes: true})
    const alp:Array<Promise<void>> = []
    for(let i = 0; i < fff.length; i++){
        const x = fff[i]
        if(!x.isDirectory()) continue
        alp.push(cp(
            Path.join(__dirname, '..', 'src', 'assets', x.name), 
            Path.join(__dirname, '..', 'build', x.name), 
            { recursive: true }))
    }
    await Promise.all(alp)
}

function RemoveFolders(){
    rmSync(Path.join(__dirname, '..', 'build'), {
        recursive: true,
        force: true,
    })
}

export async function main(){
    RemoveFolders()
    const w1 = buildRenderer()
    
    return Promise.allSettled([
        w1
    ]).then(() => {
        console.log(Chalk.greenBright('Renderer successfully transpiled! (ready to be built with electron-builder)'));
    });
}

if (require.main === module) {
    main();
}
