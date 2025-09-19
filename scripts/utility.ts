import { existsSync, mkdirSync, rmdirSync } from 'fs';
import { copyFile, cp, readFile, writeFile, rmdir } from 'fs/promises';
import Path from 'path';
import * as pkg from 'pkg';
import * as electron from './build';
import compileTs from './private/tsc';
import * as share from './share';

export async function Share_Call() {
    return share.main()
}

export async function Build_Electron(){
    return electron.main()
}

export async function Build_Program(){
    const programPath = Path.join(__dirname, '..', 'src', 'program');
    return compileTs(programPath);
}

export async function Build_Node() {
    const nodePath = Path.join(__dirname, '..', 'src', 'node');
    return compileTs(nodePath);
}

export async function Build_Cluster() {
    const nodePath = Path.join(__dirname, '..', 'src', 'cluster');
    return compileTs(nodePath);
}

export async function Build_Server(){
    const nodePath = Path.join(__dirname, '..', 'src', 'server');
    return compileTs(nodePath);
}

export async function PKG_Program(platform:string, arch?:string){
    const exeDir = Path.join(__dirname, "..", "bin")
    if(existsSync(exeDir)) await rmdir(exeDir, {recursive: true})
    const exePath = Path.join(exeDir, platform == "win" ? 'worker.exe' : 'worker');
    const programPath = Path.join(__dirname, '..', 'build', 'program', 'worker.js');
    return pkg.exec(["-d", "-t", `node16-${platform}-${arch || 'x64'}`, "-o", exePath, "--public-packages", "*", programPath])
}

export async function PKG_Node(){
    const exePath = Path.join(__dirname, '..', 'build', 'node-build', 'app.exe');
    const programPath = Path.join(__dirname, '..', 'build', 'node', 'index.js');
    return pkg.exec(["-d", "-t", "node16-x64", "-o", exePath, "--public-packages", "*", programPath])
}

export async function Copy_PackageJson2Node() {
    const from = Path.join(__dirname, '..', 'node_package.json');
    await SyncVersionName(from, '_node')
    const to = Path.join(__dirname, '..', 'build', 'node', 'package.json');
    return copyFile(from, to)
}

export async function Copy_PackageJson2NodeBuild() {
    const from = Path.join(__dirname, '..', 'node_build_package.json');
    await SyncVersionName(from, '_node')
    const to = Path.join(__dirname, '..', 'build', 'node-build', 'package.json');
    return copyFile(from, to)
}

export async function Copy_Bin2Server() {
    const from = Path.join(__dirname, '..', 'bin');
    const to = Path.join(__dirname, '..', 'build', 'server', 'bin');
    return cp(from, to, {recursive: true})
}

export async function Copy_PackageJson2Server() {
    const from = Path.join(__dirname, '..', 'server_package.json');
    await SyncVersionName(from, '_server')
    const to = Path.join(__dirname, '..', 'build', 'server', 'package.json');
    return copyFile(from, to)
}

export async function Copy_Render2Server() {
    const source = Path.join(__dirname, '..', 'build', 'renderer')
    const p = Path.join(__dirname, '..', 'build', 'server', 'public')
    return cp(source, p, { recursive: true })
}

export async function Copy_Render2Server_DEV() {
    const source = Path.join(__dirname, '..', 'build', 'renderer')
    const p = Path.join(__dirname, '..', 'build', 'server', 'public')
    return cp(source, p, { recursive: true })
}

export async function Copy_Worker2Node(){
    const exePath = Path.join(__dirname, '..', 'bin');
    const endProgramFolderPath = Path.join(__dirname, '..', 'build', 'node', 'bin');
    if(!existsSync(endProgramFolderPath)) mkdirSync(endProgramFolderPath)
    return cp(exePath, endProgramFolderPath, { recursive: true })
}

export async function Copy_Worker2NodeBuild(){
    const exePath = Path.join(__dirname, '..', 'bin');
    const endProgramFolderPath = Path.join(__dirname, '..', 'build', 'node-build', 'bin');
    if(!existsSync(endProgramFolderPath)) mkdirSync(endProgramFolderPath)
    return cp(exePath, endProgramFolderPath, { recursive: true })
}

export function Clean_Node(){
    if(existsSync(Path.join(__dirname, '..', 'build', 'node'))){
        rmdirSync(Path.join(__dirname, '..', 'build', 'node'), {recursive: true})
    }
}

export function Clean_Cluster(){
    if(existsSync(Path.join(__dirname, '..', 'build', 'cluster'))){
        rmdirSync(Path.join(__dirname, '..', 'build', 'cluster'), {recursive: true})
    }
}

export function Clean_Node_Build(){
    if(existsSync(Path.join(__dirname, '..', 'build', 'node-build'))){
        rmdirSync(Path.join(__dirname, '..', 'build', 'node-build'), {recursive: true})
    }
    mkdirSync(Path.join(__dirname, '..', 'build', 'node-build'))
}

export async function SyncVersionName(target:string, suffix:string, source:string = Path.join(__dirname, '..', 'package.json')){
    const source_json = JSON.parse(((await readFile(source)).toString()))
    const target_json = JSON.parse(((await readFile(target)).toString()))
    target_json.name = `${source_json.name}${suffix}`
    target_json.version = source_json.version
    await writeFile(target, JSON.stringify(target_json, null, 4))
}