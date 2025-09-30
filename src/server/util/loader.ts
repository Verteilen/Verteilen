import * as fs from "fs";
import * as ws from 'ws';
import * as path from "path";
import * as os from "os";
import { DATA_FOLDER, GlobalPermission, Header, PermissionType, UserProfile } from "../interface";

export type TypeMap = { [key:string]:Function }

export const Loader = (typeMap:TypeMap, key:string, folder:string, per:PermissionType, ext:string = ".json") => {
    const GetUserType = (token?:string):GlobalPermission | undefined => {
        const pa_root = path.join(os.homedir(), DATA_FOLDER)
        const pa = path.join(pa_root, 'user')
        if(!fs.existsSync(pa)) fs.mkdirSync(pa, {recursive: true});
        if(token != undefined){
            const target_path = path.join(pa, token + '.json')
            const p:UserProfile = JSON.parse(fs.readFileSync(target_path).toString())
            return p.permission
        }
        return undefined
    }


    typeMap[`load_all_${key}`] = (socket:ws.WebSocket, token?:string) => {
        const per = GetUserType(token)
        const root = path.join(os.homedir(), DATA_FOLDER, folder)
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
    typeMap[`delete_all_${key}`] = (socket:ws.WebSocket, token?:string) => {
        const per = GetUserType(token)
        const root = path.join(os.homedir(), DATA_FOLDER, folder)
        if (!fs.existsSync(root)) fs.rmSync(root, {recursive: true})
        fs.mkdirSync(root, {recursive: true})
    }
    typeMap[`list_all_${key}`] = (socket:ws.WebSocket, token?:string) => {
        const per = GetUserType(token)
        const root = path.join(os.homedir(), DATA_FOLDER, folder)
        if (!fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
        const ps = fs.readdirSync(root, { withFileTypes: false })
        const d:Header = {
            name: `list_all_${key}-feedback`,
            data: JSON.stringify(ps)
        }
        socket.send(JSON.stringify(d))
    }
    typeMap[`save_${key}`] = (socket:ws.WebSocket, name:string, data:string, token?:string) => {
        const per = GetUserType(token)
        const root = path.join(os.homedir(), DATA_FOLDER, folder)
        if (!fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
        let filename = name + ext
        let p = path.join(root, filename)
        fs.writeFileSync(p, data)
    }
    typeMap[`rename_${key}`] = (socket:ws.WebSocket, name:string, newname:string, token?:string) => {
        const per = GetUserType(token)
        const root = path.join(os.homedir(), DATA_FOLDER, folder)
        if (!fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
        fs.cpSync(path.join(root, `${name}.json`), path.join(root, `${newname}.json`), { recursive: true })
        fs.rmdirSync(path.join(root, `${name}.json`))
    }
    typeMap[`delete_${key}`] = (socket:ws.WebSocket, name:string, token?:string) => {
        const per = GetUserType(token)
        const root = path.join(os.homedir(), DATA_FOLDER, folder)
        if (!fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
        const filename = name + ext
        const p = path.join(root, filename)
        if (fs.existsSync(p)) fs.rmSync(p)
    }
    typeMap[`delete_all_${key}`] = (socket:ws.WebSocket, name:string, token?:string) => {
        const per = GetUserType(token)
        const root = path.join(os.homedir(), DATA_FOLDER, folder)
        if (!fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
        const ps = fs.readdirSync(root, { withFileTypes: false })
        ps.forEach(x => fs.rmSync(path.join(root, x)))
    }
    typeMap[`load_${key}`] = (socket:ws.WebSocket, name:string, token?:string) => {
        const per = GetUserType(token)
        const root = path.join(os.homedir(), DATA_FOLDER, folder)
        if (!fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
        const filename = name + ext
        const p = path.join(root, filename)
        if (fs.existsSync(p)){
            const file = fs.readFileSync(p, { encoding: 'utf8', flag: 'r' })
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