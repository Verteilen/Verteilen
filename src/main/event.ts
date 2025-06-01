import { dialog, ipcMain } from "electron";
import fs from "fs";
import path from "path";
import { Client } from "./client/client";
import { ClientJavascript } from "./client/javascript";
import { messager, messager_log } from "./debugger";
import { mainWindow } from "./electron";
import { ExecuteRecord, Job, Parameter, Preference, Project, Record } from "./interface";
import { i18n } from "./plugins/i18n";
import { ExecuteManager } from "./script/execute_manager";
import { Util_Server_Console_Proxy } from "./util/server/console_handle";
import { Util_Server } from "./util/server/server";
import { Util_Server_Log_Proxy } from "./util/server/log_handle";

export class BackendEvent {
    menu_state = false
    client:Client | undefined = undefined
    job: Job | undefined
    util: Util_Server = new Util_Server(this)

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
        this.AppInit()
        this.ExecuteInit()
    }

    ExecuteInit = () => {
        ipcMain.handle('console_add', (event, data:string) => {
            const _data:any = JSON.parse(data)
            const name:string = _data.name
            const record:Record =_data.record
            const em:ExecuteManager = new ExecuteManager(
                name,
                this.util.websocket_manager!, 
                messager_log, 
                JSON.parse(JSON.stringify(record))
            )
            const er:ExecuteRecord = {
                ...record,
                running: false,
                stop: true,
                process_type: -1,
                useCron: false,
                para: undefined,
                command: [],
                project: '',
                task: '',
                project_index: -1,
                task_index: -1,
                project_state: [],
                task_state: [],
                task_detail: [],
            }
            em.libs = this.util.libs
            const p:[ExecuteManager, ExecuteRecord] = [em, er]
            const uscp:Util_Server_Console_Proxy = new Util_Server_Console_Proxy(p)
            const uslp:Util_Server_Log_Proxy = new Util_Server_Log_Proxy(p, this.util.logs, this.util.preference!)
            em.proxy = this.util.CombineProxy([uscp.execute_proxy, uslp.execute_proxy])
            const r = this.util.console.receivedPack(p, record)
            return r;
        })
    }

    AppInit = () => {
        ipcMain.on('client_start', (event, content:string) => {
            this.Init()
        })
        ipcMain.on('client_stop', (event, content:string) => {
            this.Destroy()
        })
        ipcMain.on('modeSelect', (event, isclient:boolean) => {
            console.log("[Backend] Mode select: " + (isclient ? "Node" : "Server"))
            if(isclient) event.sender.send('msgAppend', { msg:" Client mode activate" })
        })
        ipcMain.handle('exist', (event, d:string) => {
            return fs.existsSync(d)
        })
        ipcMain.on('javascript', (event, content:string) => {
            const javascript_messager_feedback = (msg:string, tag?:string) => {
                messager(msg, tag)
                event.sender.send('lua-feedback', msg)
            }
            const javascript_messager_log_feedback = (msg:string, tag?:string) => {
                messager_log(msg, tag)
                event.sender.send('lua-feedback', msg)
            }
            const javascript:ClientJavascript = new ClientJavascript(javascript_messager_feedback, javascript_messager_log_feedback, () => this.job)
            const r = javascript.JavascriptExecute(content)
            event.sender.send('lua-feedback', r?.toString() ?? '')
        })
        ipcMain.on('message', (event, message:string, tag?:string) => {
            console.log(`${ tag == undefined ? '[Electron Backend]' : '[' + tag + ']' } ${message}`);
        })
        this.Loader('record', 'record')
        this.Loader('parameter', 'parameter')
        this.Loader('node', 'node')
        this.Loader('log', 'log')
        this.Loader('lib', 'lib', '')

        ipcMain.handle('load_record_obsolete', (e) => {
            if(!fs.existsSync('record.json')) return undefined
            const data = fs.readFileSync('record.json').toString()
            fs.rmSync('record.json')
            return data
        })
        
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
                    theme: "dark",
                    notification: false,
                }
                fs.writeFileSync('preference.json', JSON.stringify(record, null, 4))
                i18n.global.locale = 'en'
                return JSON.stringify(record)
            } else {
                const file = fs.readFileSync('preference.json', { encoding: 'utf8', flag: 'r' })
                const jsonString = file.toString()
                this.util.preference = JSON.parse(jsonString)
                return jsonString
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
        })
    }

    Loader = (key:string, folder:string, ext:string = ".json") => {
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
            if (fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
            let filename = name + ext
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
            const filename = name + ext
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
            if(v.filePaths.length < 1) return;
            const p = JSON.parse(fs.readFileSync(v.filePaths[0]).toString())
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