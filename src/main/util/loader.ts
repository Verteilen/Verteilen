import { ipcMain } from "electron";
import fs from "fs";
import path from "path";

export const Loader = (key:string, folder:string, ext:string = ".json") => {
    ipcMain.handle(`load_all_${key}`, (e) => {
        const root = path.join("data", folder)
        if (!fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
        const r:Array<string> = []
        const ffs = fs.readdirSync(root, {withFileTypes: true})
        ffs.forEach(x => {
            if(!x.isFile()) return
            const file = fs.readFileSync(path.join(root, x.name), { encoding: 'utf8', flag: 'r' })
            r.push(file)
        })
        return JSON.stringify(r)
    })
    ipcMain.on(`delete_all_${key}`, (e) => {
        const root = path.join("data", folder)
        if (!fs.existsSync(root)) fs.rmSync(root, {recursive: true})
        fs.mkdirSync(root, {recursive: true})
    })
    ipcMain.handle(`list_all_${key}`, (e) => {
        const root = path.join("data", folder)
        if (!fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
        const ps = fs.readdirSync(root, { withFileTypes: false })
        const r:any = []
        for(let i = 0; i < ps.length; i++){
            const x = ps[i]
            const stat = fs.statSync(path.join(root, x.toString()))
            r.push({
                name: x,
                size: stat.size,
                time: stat.ctime
            })
        }
        return JSON.stringify(r)
    })
    ipcMain.on(`save_${key}`, (e, name:string, data:string) => {
        const root = path.join("data", folder)
        if (!fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
        let filename = name + ext
        let p = path.join(root, filename)
        fs.writeFileSync(p, data)
    })
    ipcMain.on(`rename_${key}`, (e, name:string, newname:string) => {
        const root = path.join("data", folder)
        if (!fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
        fs.cpSync(path.join(root, `${name}.json`), path.join(root, `${newname}.json`), { recursive: true })
        fs.rmdirSync(path.join(root, `${name}.json`))
    })
    ipcMain.on(`delete_${key}`, (e, name:string) => {
        const root = path.join("data", folder)
        if (!fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
        const filename = name + ext
        const p = path.join(root, filename)
        if (fs.existsSync(p)) fs.rmSync(p)
    })
    ipcMain.on(`delete_all_${key}`, (e, name:string) => {
        const root = path.join("data", folder)
        if (!fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
        const ps = fs.readdirSync(root, { withFileTypes: false })
        ps.forEach(x => fs.rmSync(path.join(root, x)))
    })
    ipcMain.handle(`load_${key}`, (e, name:string) => {
        const root = path.join("data", folder)
        if (!fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
        const filename = name + ext
        const p = path.join(root, filename)
        if (fs.existsSync(p)){
            const file = fs.readFileSync(p, { encoding: 'utf8', flag: 'r' })
            return file.toString()
        }else{
            return undefined
        }
    })
}