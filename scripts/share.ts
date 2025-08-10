import Chalk from 'chalk'
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { readdir } from 'fs/promises'
import Path from 'path'

const dirs = ["main", "node", "renderer", "server", "program"]
const clients = ["client", "interface", "lan", "plugins", "script", "interface.ts", "util"]

const copyToWhere = (index) => {
    switch(index){
        default:
            return []
        case 0: // client
            return [0, 1, 3, 4]
        case 1: // interface
            return [0, 1, 2, 3, 4]
        case 5: // interface.ts
            return [0, 1, 2, 3, 4]
        case 2: // lan
            return [0, 1, 2, 3, 4]
        case 3: // plugins
            return [0, 1, 2, 3, 4]
        case 4: // script
            return [0, 1, 2, 3, 4]
        case 6: // util
            return [0, 2, 3]
    }
}

const templateCopy = async () => {
    const pacakge = [Path.join(__dirname, "..", "package.json"), Path.join(__dirname, "..", "src", "template", "package.json")]
    const s1 = [Path.join(__dirname, "..", "src", "share", "interface.ts"), Path.join(__dirname, "..", "src", "template", "interface.ts")]
    const s2 = [Path.join(__dirname, "..", "src", "share", "interface", "base.ts"), Path.join(__dirname, "..", "src", "template", "interface", "base.ts")]
    const s3 = [Path.join(__dirname, "..", "src", "share", "interface", "enum.ts"), Path.join(__dirname, "..", "src", "template", "interface", "enum.ts")]
    const s4 = [Path.join(__dirname, "..", "src", "share", "interface", "struct.ts"), Path.join(__dirname, "..", "src", "template", "interface", "struct.ts")]
    const ss = [s1, s2, s3, s4]
    mkdirSync(Path.join(__dirname, "..", "src", "template"), {recursive: true})
    for(const x of ss){
        cpSync(x[0], x[1])
    }
    const interfaceTex = readFileSync(s1[1]).toString()
    const interfaceTexs = interfaceTex.split('\n').filter(x => !x.startsWith("export * from "))   
    interfaceTexs.push("export * from './interface/base'")
    interfaceTexs.push("export * from './interface/enum'")
    interfaceTexs.push("export * from './interface/struct'")
    writeFileSync(s1[1], interfaceTexs.join('\n'))

    const baseTex = readFileSync(s2[1]).toString()
    const baseTexs = baseTex.split('\n').filter(x => !x.includes('LocalPermiision'))
    writeFileSync(s2[1], baseTexs.join('\n'))

    const pa0 = JSON.parse(readFileSync(pacakge[0]).toString())
    const pa1 = JSON.parse(readFileSync(pacakge[1]).toString())
    pa1.version = pa0.version
    writeFileSync(pacakge[1], JSON.stringify(pa1, null, 4))
}

export async function main() {
    return new Promise<void>(async (resolve) => {
        const files = await readdir(Path.join(__dirname, "..", "src", "share"))
        files.forEach(x => {
            if(x == "tsconfig.json") return
            const index = clients.findIndex(y => y == x)
            const r = copyToWhere(index)
            r.forEach(rs => {
                const y = dirs[rs]
                const p = cpSync(
                    Path.join(__dirname, "..", "src", "share", x),
                    Path.join(__dirname, "..", "src", y, x), 
                    { recursive: true }
                )
            })
        })
        await templateCopy()
        console.log(Chalk.greenBright("Sync share files done !"))
        resolve()
        return
    })
}

if (require.main === module) {
    main();
}