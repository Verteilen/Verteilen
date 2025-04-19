import { dialog, ipcMain } from "electron";
import fs from "fs";
import path from "path";
import { Client } from "./client/client";
import { ClientLua } from "./client/lua";
import { messager, messager_log } from "./debugger";
import { mainWindow } from "./electron";
import { Job, Parameter, Preference, Project, Record } from "./interface";
import { menu_client, menu_server, setupMenu } from "./menu";
import { i18n } from "./plugins/i18n";

export class BackendEvent {
    menu_state = false
    client:Client | undefined = undefined
    job: Job | undefined

    Init = () => {
        if(this.client != undefined) return
        this.client = new Client(messager, messager_log)
        this.client.Init()
    }

    Destroy = () => {
        if(this.client == undefined) return
        this.client.Destroy()
        this.client.Dispose()
        this.client = undefined
    }

    EventInit = () => {
        ipcMain.on('client_start', (event, content:string) => {
            this.Init()
        })
        ipcMain.on('client_stop', (event, content:string) => {
            this.Destroy()
        })
        ipcMain.on('lua', (event, content:string) => {
            const lua_messager_feedback = (msg:string, tag?:string) => {
                messager(msg, tag)
                event.sender.send('lua-feedback', msg)
            }
            const lua_messager_log_feedback = (msg:string, tag?:string) => {
                messager_log(msg, tag)
                event.sender.send('lua-feedback', msg)
            }
            const lua:ClientLua = new ClientLua(lua_messager_feedback, lua_messager_log_feedback, () => this.job)
            const r = lua.LuaExecute(content)
            event.sender.send('lua-feedback', r?.toString() ?? '')
        })
        ipcMain.on('message', (event, message:string, tag?:string) => {
            console.log(`${ tag == undefined ? '[Electron Backend]' : '[' + tag + ']' } ${message}`);
        })
        
        ipcMain.on('modeSelect', (event, isclient:boolean) => {
            console.log("[Backend] Mode select: " + (isclient ? "Node" : "Server"))
            if(isclient) event.sender.send('msgAppend', "Client mode activate")
        })
        ipcMain.handle('exist', (event, d:string) => {
            return fs.existsSync(d)
        })
        ipcMain.on('menu', (event, on:boolean):void => {
            if(mainWindow == undefined) return;
            console.log(`[Backend] Menu Display: ${on}`)
            this.menu_state = on
            if(on) mainWindow.setMenu(menu_server!)
            else mainWindow.setMenu(menu_client!)
        })
        //this.Loader('record', 'record')
        ipcMain.on('save_record', (e, record:string) => {
            fs.writeFileSync('record.json', record)
        })
        ipcMain.handle('load_record', (e) => {
            const exist = fs.existsSync('record.json');
            messager_log(`[Event] Read record.js, file exist: ${exist}`)
            if(!exist){
                const record:Record = {
                    projects: [],
                    nodes: []
                }
                fs.writeFileSync('record.json', JSON.stringify(record, null, 4))
                return JSON.stringify(record)
            } else {
                const file = fs.readFileSync('record.json', { encoding: 'utf8', flag: 'r' })
                return file.toString()
            }
        })
        this.Loader('log', 'log')
        this.Loader('lib', 'lib')
        
        ipcMain.on('save_preference', (e, preference:string) => {
            fs.writeFileSync('preference.json', preference)
        })
        ipcMain.handle('load_preference', (e) => {
            const exist = fs.existsSync('preference.json');
            messager_log(`[Event] Read preference.js, file exist: ${exist}`)
            if(!exist){
                const record:Preference = {
                    lan: 'en',
                    log: true,
                    font: 18,
                }
                fs.writeFileSync('preference.json', JSON.stringify(record, null, 4))
                i18n.global.locale = 'en'
                setupMenu()
                return JSON.stringify(record)
            } else {
                const file = fs.readFileSync('preference.json', { encoding: 'utf8', flag: 'r' })
                return file.toString()
            }
        })
        ipcMain.on('export_projects', (event, data:string) => {
            const p:Array<Project> = JSON.parse(data)
            this.ExportProjects(p)
        })
        ipcMain.on('import_project', (event) => {
            this.ImportProject()
        })
        ipcMain.on('export_project', (event, data:string) => {
            const p:Project = JSON.parse(data)
            this.ExportProject(p)
        })
        ipcMain.on('import_parameter', (event) => {
            this.ImportParameter()
        })
        ipcMain.on('export_parameter', (event, data:string) => {
            const p:Parameter = JSON.parse(data)
            this.ExportParameter(p)
        })
        ipcMain.on('locate', (event, data:string) => {
            // @ts-ignore
            i18n.global.locale = data
            setupMenu()
        })
    }

    Loader = (key:string, folder:string) => {
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
            if (fs.existsSync(root)) fs.rmSync(root, {recursive: true})
            fs.mkdirSync(root, {recursive: true})
        })
        ipcMain.handle(`list_all_${key}`, (e) => {
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
        })
        ipcMain.on(`save_${key}`, (e, name:string, data:string) => {
            const root = path.join("data", folder)
            if (fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
            let filename = name + ".json"
            let p = path.join(root, filename)
            fs.writeFileSync(p, data)
        })
        ipcMain.on(`rename_${key}`, (e, name:string, newname:string) => {
            const root = path.join("data", folder)
            if (fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
            fs.cpSync(path.join(root, `${name}.json`), path.join(root, `${newname}.json`), { recursive: true })
            fs.rmdirSync(path.join(root, `${name}.json`))
        })
        ipcMain.on(`delete_${key}`, (e, name:string) => {
            const root = path.join("data", folder)
            if (fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
            const filename = name + ".json"
            const p = path.join(root, filename)
            if (fs.existsSync(p)) fs.rmSync(p)
        })
        ipcMain.on(`delete_all_${key}`, (e, name:string) => {
            const root = path.join("data", folder)
            if (fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
            const ps = fs.readdirSync(root, { withFileTypes: false })
            ps.forEach(x => fs.rmSync(path.join(root, x)))
        })
        ipcMain.handle(`load_${key}`, (e, name:string) => {
            const root = path.join("data", folder)
            if (fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
            const filename = name + ".json"
            const p = path.join(root, filename)
            if (fs.existsSync(p)){
                const file = fs.readFileSync('log.json', { encoding: 'utf8', flag: 'r' })
                return file.toString()
            }else{
                return undefined
            }
        })
        
    }

    ImportProject = () => {
        if(mainWindow == undefined) return;
        dialog.showOpenDialog(mainWindow, {
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: 'JSON', extensions: ['json'] },
            ]
        }).then(v => {
            if (v.canceled) return
            if(mainWindow == undefined) return;
            const p:Array<any> = []
            for(const x of v.filePaths){
                p.push(JSON.parse(fs.readFileSync(x).toString()))
            }
            mainWindow.webContents.send('import_project_feedback', JSON.stringify(p))
        })
    }
    
    ExportProject = (value:Project) => {
        if(mainWindow == undefined) return;
        dialog.showSaveDialog(mainWindow, {
            filters: [
                {
                    name: "JSON",
                    extensions: ['json']
                }
            ]
        }).then(v => {
            if (v.canceled || v.filePath.length == 0) return
            const path = v.filePath
            console.log("Export project to path: ", path)
            fs.writeFileSync(path, JSON.stringify(value, null, 4))
        })
    }
    
    ExportProjects = (value:Array<Project>) => {
        if(mainWindow == undefined) return;
        dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        }).then(v => {
            if (v.canceled || v.filePaths.length == 0) return
            if(mainWindow == undefined) return;
            const path = v.filePaths[0]
            for(var x of value){
                fs.writeFileSync(`${path}/${x.title}.json`, JSON.stringify(x, null, 4))
            }
        })
    }

    ImportParameter = () => {
        if(mainWindow == undefined) return;
        dialog.showOpenDialog(mainWindow, {
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: 'JSON', extensions: ['json'] },
            ]
        }).then(v => {
            if (v.canceled) return
            if(mainWindow == undefined) return;
            const p:Array<any> = []
            for(const x of v.filePaths){
                p.push(JSON.parse(fs.readFileSync(x).toString()))
            }
            mainWindow.webContents.send('import_parameter_feedback', JSON.stringify(p))
        })
    }

    ExportParameter = (value:Parameter) => {
        if(mainWindow == undefined) return;
        dialog.showSaveDialog(mainWindow, {
            filters: [
                {
                    name: "JSON",
                    extensions: ['json']
                }
            ]
        }).then(v => {
            if (v.canceled || v.filePath.length == 0) return
            const path = v.filePath
            console.log("Export project to path: ", path)
            fs.writeFileSync(path, JSON.stringify(value, null, 4))
        })
    }
}

export const backendEvent = new BackendEvent()