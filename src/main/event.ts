import { ipcMain } from "electron";
import fs from "fs";
import { Loader } from './util/loader'
import { Client } from "./client/client";
import { ClientJavascript } from "./client/javascript";
import { messager, messager_log } from "./debugger";
import { ExecuteRecord, Job, Parameter, Preference, Project, Record } from "./interface";
import { i18n } from "./plugins/i18n";
import { ExecuteManager } from "./script/execute_manager";
import { Util_Server_Console_Proxy } from "./util/server/console_handle";
import { Util_Server } from "./util/server/server";
import { Util_Server_Log_Proxy } from "./util/server/log_handle";
import { ExportProjects, ImportProject, ExportProject, ImportParameter, ExportParameter } from "./util/io";

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
        Loader('record', 'record')
        Loader('parameter', 'parameter')
        Loader('node', 'node')
        Loader('log', 'log')
        Loader('lib', 'lib', '')

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
            ExportProjects(p)
        })
        ipcMain.on('import_project', (event) => {
            ImportProject()
        })
        ipcMain.on('export_project', (event, data:string) => {
            const p:Project = JSON.parse(data)
            ExportProject(p)
        })
        ipcMain.on('import_parameter', (event) => {
            ImportParameter()
        })
        ipcMain.on('export_parameter', (event, data:string) => {
            const p:Parameter = JSON.parse(data)
            ExportParameter(p)
        })
        ipcMain.on('locate', (event, data:string) => {
            // @ts-ignore
            i18n.global.locale = data
        })
    }
}

export const backendEvent = new BackendEvent()