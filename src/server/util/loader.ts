import fs from "fs";
import ws from 'ws';
import path from "path";
import { Header } from "../interface";

export type TypeMap = { [key:string]:Function }

export const Loader = (typeMap:TypeMap, key:string, folder:string, ext:string = ".json") => {
    typeMap[`load_all_${key}`] = (dummy: number, socket:ws.WebSocket) => {
        const root = path.join("data", folder)
        if (!fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
        const r:Array<string> = []
        const ffs = fs.readdirSync(root, {withFileTypes: true})
        ffs.forEach(x => {
            if(!x.isFile()) return
            const file = fs.readFileSync(path.join(root, x.name), { encoding: 'utf8', flag: 'r' })
            r.push(file)
        })
        const d:Header = {
            name: `load_all_${key}-feedback`,
            data: JSON.stringify(r)
        }
        socket.send(JSON.stringify(d))
    }
    typeMap[`delete_all_${key}`] = (dummy: number, socket:ws.WebSocket) => {
        const root = path.join("data", folder)
        if (fs.existsSync(root)) fs.rmSync(root, {recursive: true})
        fs.mkdirSync(root, {recursive: true})
    }
    typeMap[`list_all_${key}`] = (dummy: number, socket:ws.WebSocket) => {
        const root = path.join("data", folder)
        if (fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
        const ps = fs.readdirSync(root, { withFileTypes: false })
        ps.map(x => {
            const stat = fs.statSync(path.join(root, x))
            return {
                name: x,
                size: stat.size,
                time: stat.ctime
            }
        })
        const d:Header = {
            name: `list_all_${key}-feedback`,
            data: JSON.stringify(ps)
        }
        socket.send(JSON.stringify(d))
    }
    typeMap[`save_${key}`] = (d:{name:string, data:string}, socket:ws.WebSocket) => {
        const root = path.join("data", folder)
        if (fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
        let filename = d.name + ext
        let p = path.join(root, filename)
        fs.writeFileSync(p, d.data)
    }
    typeMap[`rename_${key}`] = (d:{name:string, newname:string}, socket:ws.WebSocket) => {
        const root = path.join("data", folder)
        if (fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
        fs.cpSync(path.join(root, `${d.name}.json`), path.join(root, `${d.newname}.json`), { recursive: true })
        fs.rmdirSync(path.join(root, `${d.name}.json`))
    }
    typeMap[`delete_${key}`] = (name:string, socket:ws.WebSocket) => {
        const root = path.join("data", folder)
        if (fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
        const filename = name + ext
        const p = path.join(root, filename)
        if (fs.existsSync(p)) fs.rmSync(p)
    }
    typeMap[`delete_all_${key}`] = (name:string, socket:ws.WebSocket) => {
        const root = path.join("data", folder)
        if (fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
        const ps = fs.readdirSync(root, { withFileTypes: false })
        ps.forEach(x => fs.rmSync(path.join(root, x)))
    }
    typeMap[`load_${key}`] = (name:string, socket:ws.WebSocket) => {
        const root = path.join("data", folder)
        if (fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
        const filename = name + ext
        const p = path.join(root, filename)
        if (fs.existsSync(p)){
            const file = fs.readFileSync('log.json', { encoding: 'utf8', flag: 'r' })
            const d:Header = {
                name: `load_${key}-feedback`,
                data: file.toString()
            }
            socket.send(JSON.stringify(d))
        }else{
            const d:Header = {
                name: `load_${key}-feedback`,
                data: undefined
            }
            socket.send(JSON.stringify(d))
        }
    }
}