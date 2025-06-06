import { Record, Task, ExecuteProxy, Project, ExecuteState, Job, FeedBack, Parameter, ExecuteRecord, Log, Libraries, AppConfig, Preference, NodeProxy, ShellFolder, Single, ExecutePair } from "../../interface"
import { ExecuteManager } from "../../script/execute_manager"
import { WebsocketManager } from "../../script/socket_manager"
import { Util_Server_Console, Util_Server_Console_Proxy } from "./console_handle"
import { BackendEvent } from "../../event"
import { ipcMain } from "electron"
import { messager_log } from "../../debugger"
import { Util_Server_Log_Proxy } from "./log_handle"

export type save_and_update = () => void

export class Util_Server {
    websocket_manager: WebsocketManager | undefined
    execute_manager: Array<ExecutePair> = []

    libs:Libraries = {libs: []}
    logs: Log = {logs: []}

    backend: BackendEvent
    console:Util_Server_Console
    preference:Preference | undefined
    config:AppConfig | undefined

    constructor(backend:BackendEvent){
        this.backend = backend
        const n:NodeProxy = {
            shellReply: this.shellReply,
            folderReply: this.folderReply
        }
        this.websocket_manager = new WebsocketManager(this.NewConnection, this.DisConnection, this.Analysis, messager_log, n)
        this.console = new Util_Server_Console(this.update)
        this.EventInit()
    }

    private update = () => {
        
    }

    private NewConnection = () => {

    }

    private DisConnection = () => {
        
    }

    private Analysis = () => {
        
    }

    private shellReply = (data:Single) => {

    }
    private folderReply = (data:ShellFolder) => {

    }

    private console_stop = (uuid:string) => {
        const target = this.execute_manager.find(x => x[0].uuid == uuid)
        if(target == undefined) return
        target[1].stop = true
        target[0].Stop()
    }

    private console_clean = (uuid:string, type:number) => {
        const target = this.execute_manager.find(x => x[0].uuid == uuid)
        if(target == undefined) return
        target[0].Clean()
        target[1].projects = []
        target[1].project = ""
        target[1].task = ""
        target[1].project_index = -1
        target[1].task_index = -1
        target[1].project_state = []
        target[1].task_state = []
        target[1].task_detail = []
        target[0].Release()
        const index = this.execute_manager.findIndex(x => x[0].uuid == uuid)
        this.execute_manager.splice(index, 1)
    }

    private EventInit = () => {
        // Node Events
        ipcMain.handle('node_list', (e) => {
            return this.websocket_manager?.targets
        })
        ipcMain.handle('node_add', (e, url:string, id:string) => {
            this.websocket_manager?.server_start(url, id)
        })
        ipcMain.handle('node_update', (e) => {
            return this.websocket_manager?.server_update()
        })
        ipcMain.on('node_delete', (e, uuid:string, reason?:string) => {
            this.websocket_manager?.server_stop(uuid, reason)
        })
        // Console Events
        ipcMain.handle('console_list', (event) => {
            return this.execute_manager
        })
        ipcMain.on('console_execute', (event, uuid:string, type:number) => {
            const target = this.execute_manager.find(x => x[0].uuid == uuid)
            if(target == undefined) return
            target[1].process_type = type
            target[1].running = true
            target[1].stop = false
            target[0].first = true
        })
        ipcMain.on('console_stop', (event, uuid:string) => {
            this.console_stop(uuid)
        })
        ipcMain.on('console_clean', (event, uuid:string, type:number) => {
            this.console_clean(uuid, type)
        })
        ipcMain.handle('console_add', (event, name:string, record:Record) => {
            const em:ExecuteManager = new ExecuteManager(
                name,
                this.websocket_manager!, 
                messager_log, 
                JSON.parse(JSON.stringify(record))
            )
            const er:ExecuteRecord = {
                ...record,
                uuid: em.uuid,
                name: name,
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
            em.libs = this.libs
            const p:ExecutePair = { manager: em, record: er }
            const uscp:Util_Server_Console_Proxy = new Util_Server_Console_Proxy(p)
            const uslp:Util_Server_Log_Proxy = new Util_Server_Log_Proxy(p, this.logs, this.preference!)
            em.proxy = this.CombineProxy([uscp.execute_proxy, uslp.execute_proxy])
            const r = this.console.receivedPack(p, record)
            return r ? er : undefined;
        })
        ipcMain.handle('console_update', (event) => {
            this.execute_manager.forEach(x => {
                if(x.record!.running && !x.record!.stop){
                    try {
                        x.manager!.Update()
                    }catch(err:any){
                        x.record!.stop = true
                        return {
                            code: 400,
                            name: err.name,
                            message: err.message
                        }
                    }
                }
                if(x.record!.stop){
                    if(x.manager!.jobstack == 0){
                        x.record!.running = false
                    }
                }
                if(x.record!.command.length > 0){
                    const p:Array<any> = x.record!.command.shift()!
                    if(p[0] == 'clean') clean()
                    else if (p[0] == 'stop') this.console_stop()
                    else if (p[0] == 'skip') skip(p[1], p[2])
                    else if (p[0] == 'execute') execute(p[1])
                }
            })
        })
    }

    CombineProxy = (eps:Array<ExecuteProxy>) => {
        const p:ExecuteProxy = {
            executeProjectStart: (data:Project):void => { eps.forEach(x => x.executeProjectStart(JSON.parse(JSON.stringify(data)))) },
            executeProjectFinish: (data:Project):void => { eps.forEach(x => x.executeProjectFinish(JSON.parse(JSON.stringify(data)))) },
            executeTaskStart: (data:[Task, number]):void => { eps.forEach(x => x.executeTaskStart(JSON.parse(JSON.stringify(data)))) },
            executeTaskFinish: (data:Task):void => { eps.forEach(x => x.executeTaskFinish(JSON.parse(JSON.stringify(data)))) },
            executeSubtaskStart: (data:[Task, number, string]):void => { eps.forEach(x => x.executeSubtaskStart(JSON.parse(JSON.stringify(data)))) },
            executeSubtaskUpdate: (data:[Task, number, string, ExecuteState]):void => { eps.forEach(x => x.executeSubtaskUpdate(JSON.parse(JSON.stringify(data)))) },
            executeSubtaskFinish: (data:[Task, number, string]):void => { eps.forEach(x => x.executeSubtaskFinish(JSON.parse(JSON.stringify(data)))) },
            executeJobStart: (data:[Job, number, string]):void => { eps.forEach(x => x.executeJobStart(JSON.parse(JSON.stringify(data)))) },
            executeJobFinish: (data:[Job, number, string, number]):void => { eps.forEach(x => x.executeJobFinish(JSON.parse(JSON.stringify(data)))) },
            feedbackMessage: (data:FeedBack):void => { eps.forEach(x => x.feedbackMessage(JSON.parse(JSON.stringify(data)))) },
            updateParameter: (data:Parameter):void => { eps.forEach(x => x.updateParameter(JSON.parse(JSON.stringify(data)))) },
        }
        return p
    }
}