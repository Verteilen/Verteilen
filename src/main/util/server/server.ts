import { Record, Task, ExecuteProxy, Project, ExecuteState, Job, FeedBack, Parameter, ExecuteRecord, Log, Libraries, AppConfig, Preference, NodeProxy, ShellFolder, Single, ExecutePair, RENDER_UPDATETICK, BusAnalysis, WebsocketPack } from "../../interface"
import { ExecuteManager } from "../../script/execute_manager"
import { WebsocketManager } from "../../script/socket_manager"
import { Util_Server_Console, Util_Server_Console_Proxy } from "./console_handle"
import { BackendEvent } from "../../event"
import { ipcMain } from "electron"
import { messager, messager_log } from "../../debugger"
import { Util_Server_Log_Proxy } from "./log_handle"
import { i18n } from "../../plugins/i18n"
import { mainWindow } from "../../electron"

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
    updatehandle: any
    re: Array<any> = []

    constructor(backend:BackendEvent){
        this.backend = backend
        const n:NodeProxy = {
            shellReply: this.shellReply,
            folderReply: this.folderReply
        }
        this.websocket_manager = new WebsocketManager(this.NewConnection, this.DisConnection, this.Analysis, messager_log, n)
        this.console = new Util_Server_Console()
        this.updatehandle = setInterval(() => {
            this.re.push(...this.console_update())
        }, RENDER_UPDATETICK);
        this.EventInit()
    }

    private NewConnection = (x:WebsocketPack) => {
        const p = {
            title: i18n.global.t('toast.connection-create-title'),
            type: 'success',
            message: `${i18n.global.t('toast.connection-create-des')}: ${x.websocket.url} \n${x.uuid}`
        }
        mainWindow?.webContents.send('makeToast', p)
        this.execute_manager.forEach(y => {
            y.manager!.NewConnection(x)
        })
    }

    private DisConnection = (x:WebsocketPack) => {
        const p = {
            title: i18n.global.t('toast.connection-remove-title'),
            type: 'error',
            message: `${i18n.global.t('toast.connection-remove-des')}: ${x.websocket.url} \n${x.uuid}`
        }
        mainWindow?.webContents.send('makeToast', p)
        this.execute_manager.forEach(y => {
            y.manager!.Disconnect(x)
        })
    }

    private Analysis = (d:BusAnalysis) => {
        this.execute_manager.forEach(x => x.manager!.Analysis(JSON.parse(JSON.stringify(d))))   
    }

    private shellReply = (data:Single) => {

    }
    private folderReply = (data:ShellFolder) => {

    }

    private console_execute = (uuid:string, type:number) => {
        const target = this.execute_manager.find(x => x.record!.uuid == uuid)
        if(target == undefined) return
        target.record!.process_type = type
        target.record!.running = true
        target.record!.stop = false
        target.manager!.first = true
    }

    private console_stop = (uuid:string) => {
        const target = this.execute_manager.find(x => x.record!.uuid == uuid)
        if(target == undefined) return
        target.record!.stop = true
        target.manager!.Stop()
    }

    private console_update = () => {
        const re:Array<any> = []
        this.execute_manager.forEach(x => {
            if(x.record!.running && !x.record!.stop){
                try {
                    x.manager!.Update()
                }catch(err:any){
                    x.record!.stop = true
                    console.log(err)
                    re.push({
                        code: 400,
                        name: err.name,
                        message: err.message,
                        stack: err.stack
                    })
                }
            }
            if(x.record!.stop){
                if(x.manager!.jobstack == 0){
                    x.record!.running = false
                }
            }
            if(x.record!.command.length > 0){
                const p:Array<any> = x.record!.command.shift()!
                if(p[0] == 'clean') this.console_clean(x.record!.uuid)
                else if (p[0] == 'stop') this.console_stop(x.record!.uuid)
                else if (p[0] == 'skip') this.console_skip(x.record!.uuid, p[1], p[2])
                else if (p[0] == 'execute') this.console_execute(x.record!.uuid, p[1])
            }
        })
        return re
    }

    private console_clean = (uuid:string) => {
        const target = this.execute_manager.find(x => x.record!.uuid == uuid)
        if(target == undefined) return
        target.manager!.Clean()
        target.record!.projects = []
        target.record!.project = ""
        target.record!.task = ""
        target.record!.project_index = -1
        target.record!.task_index = -1
        target.record!.project_state = []
        target.record!.task_state = []
        target.record!.task_detail = []
        target.manager!.Release()
        const index = this.execute_manager.findIndex(x => x.record!.uuid == uuid)
        this.execute_manager.splice(index, 1)
    }

    private console_skip = (uuid:string, type:number, state:ExecuteState = ExecuteState.FINISH) => {
        const target = this.execute_manager.find(x => x.record!.uuid == uuid)
        if(target == undefined) return
        if(type == 0){
            // Project
            target.record!.project_state[target.record!.project_index].state = state != undefined ? state : ExecuteState.FINISH
            target.record!.project_index += 1
            if(target.record!.project_index == target.record!.projects.length) {
                target.record!.project_index = -1
                this.console_clean(uuid)
            }
            else {
                target.record!.task_state = target.record!.projects[target.record!.project_index].task.map(x => {
                    return {
                        uuid: x.uuid,
                        state: ExecuteState.NONE
                    }
                })
                target.record!.task_detail = []
                const p = target.record!.projects[target.record!.project_index]
                const t = p.task[target.record!.task_index]
                const count = target.manager!.get_task_state_count(t)
                for(let i = 0; i < count; i++){
                    target.record!.task_detail.push({
                        index: i,
                        node: "",
                        message: [],
                        state: ExecuteState.NONE
                    })
                }
                const index = target.manager!.SkipProject()
                console.log("Skip project, index: %d, next count: %d", index, count)
            }
        }else if (type == 1){
            // Task
            target.record!.task_state[target.record!.task_index].state = state != undefined ? state : ExecuteState.FINISH
            target.record!.task_index += 1
            if(target.record!.task_index == target.record!.task_state.length) {
                this.console_skip(uuid, 0)
            }else{
                target.record!.task_state[target.record!.task_index].state = state != undefined ? state : ExecuteState.FINISH
                target.record!.task_detail = []
                const p = target.record!.projects[target.record!.project_index]
                const t = p.task[target.record!.task_index]
                const count = target.manager!.get_task_state_count(t)
                for(let i = 0; i < count; i++){
                    target.record!.task_detail.push({
                        index: i,
                        node: "",
                        message: [],
                        state: ExecuteState.NONE
                    })
                }
                const index = target.manager!.SkipTask()
                console.log("Skip task, index: %d, next count: %d", index, count)
            }
        }
    }

    private console_skip2 = (uuid:string, v:number) => {
        const target = this.execute_manager.find(x => x.record!.uuid == uuid)
        if(target == undefined) return
        const index = target.manager!.SkipSubTask(v)
        if(index < 0) {
            console.error("Skip step failed: ", index)
            return
        }
        for(let i = 0; i < index; i++){
            target.record!.task_detail[i].state = ExecuteState.FINISH
        }
        console.log("Skip task", index)
    }

    private EventInit = () => {
        // Node Events
        ipcMain.handle('node_list', (e) => {
            return this.websocket_manager?.targets
        })
        ipcMain.on('node_add', (e, url:string, id:string) => {
            this.websocket_manager!.server_start(url, id)
        })
        ipcMain.handle('node_update', (e) => {
            return this.websocket_manager?.server_update()
        })
        ipcMain.on('node_delete', (e, uuid:string, reason?:string) => {
            this.websocket_manager!.server_stop(uuid, reason)
        })
        // Console Events
        ipcMain.handle('console_list', (event) => {
            return this.execute_manager.map(x => x.record)
        })
        ipcMain.handle('console_record', (event, uuid:string) => {
            const r = this.execute_manager.find(x => x.record?.uuid == uuid)?.record
            return JSON.stringify(r)
        })
        ipcMain.on('console_execute', (event, uuid:string, type:number) => {
            this.console_execute(uuid, type)
        })
        ipcMain.on('console_stop', (event, uuid:string) => {
            this.console_stop(uuid)
        })
        ipcMain.on('console_clean', (event, uuid:string) => {
            this.console_clean(uuid)
        })
        ipcMain.on('console_skip', (event, uuid:string, type:number, state:ExecuteState) => {
            this.console_skip(uuid, type, state)
        })
        ipcMain.on('console_skip2', (event, uuid:string, type:number) => {
            this.console_skip2(uuid, type)
        })
        ipcMain.handle('console_add', (event, name:string, record:Record) => {
            const em:ExecuteManager = new ExecuteManager(
                name,
                this.websocket_manager!, 
                messager,
                JSON.parse(JSON.stringify(record)),
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
            if(r) this.execute_manager.push(p)
            return r ? er : undefined;
        })
        ipcMain.handle('console_update', (event) => {
            const p = this.re
            this.re = []
            return p
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