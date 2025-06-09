import Chalk from 'chalk';
import { readdirSync, rmSync } from 'fs';
import { cp, readdir } from 'fs/promises';
import Path from 'path';
import Vite from 'vite';
import compileTs from './private/tsc';

async function buildRenderer() {
    await Vite.build({
        configFile: Path.join(__dirname, '..', 'vite.config.js'),
        base: './',
        mode: 'production'
    });
    const fff = await readdir(Path.join(__dirname, '..', 'src', 'renderer', 'assets'), {withFileTypes: true})
    const alp:Array<Promise<void>> = []
    for(let i = 0; i < fff.length; i++){
        const x = fff[i]
        if(!x.isDirectory()) continue
        alp.push(cp(
            Path.join(__dirname, '..', 'src', 'renderer', 'assets', x.name), 
            Path.join(__dirname, '..', 'build', 'renderer', x.name), 
            { recursive: true }))
    }
    await Promise.all(alp)
}

function buildMain() {
    const mainPath = Path.join(__dirname, '..', 'src', 'main');
    return compileTs(mainPath);
}

function RemoveFolders(){
    rmSync(Path.join(__dirname, '..', 'build', 'main'), {
        recursive: true,
        force: true,
    })
    
    rmSync(Path.join(__dirname, '..', 'build', 'renderer'), {
        recursive: true,
        force: true,
    })
    
    rmSync(Path.join(__dirname, '..', 'dist'), {
        recursive: true,
        force: true,
    })
}

export async function main(){
    RemoveFolders()
    const w1 = buildRenderer()
    const w2 = buildMain()
    
    return Promise.allSettled([
        w1, w2
    ]).then(() => {
        console.log(Chalk.greenBright('Renderer & main successfully transpiled! (ready to be built with electron-builder)'));
    });
}

if (require.main === module) {
    main();
}
