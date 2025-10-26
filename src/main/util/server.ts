import { v6 as uuidv6 } from 'uuid';
import { BackendEvent } from "../event"
import { ipcMain } from "electron"
import { messager, messager_log } from "../debugger"
//import { i18n } from "../../plugins/i18n"
import { mainWindow } from "../electron"
import { 
    UtilServer_Console,
    UtilServer_Log,
    Execute_ExecuteManager,
    Execute_SocketManager,
    Record, 
    Task, 
    ExecuteProxy, 
    Project, 
    ExecuteState, 
    Job, 
    FeedBack, 
    Parameter, 
    ExecuteRecord, 
    Preference, 
    NodeProxy, 
    ShellFolder, 
    Single, 
    ExecutePair, 
    RENDER_UPDATETICK, 
    BusAnalysis, 
    WebsocketPack, 
    Header 
} from "../interface"

export type save_and_update = () => void

export class Util_Server {
    websocket_manager: Execute_SocketManager.WebsocketManager | undefined
    execute_manager: Array<ExecutePair> = []

    backend: BackendEvent
    console:UtilServer_Console.Util_Server_Console
    preference:Preference | undefined
    updatehandle: any
    /**
     * message, trace message, error message return data, for update
     */
    re: Array<any> = []

    constructor(backend:BackendEvent){
        this.backend = backend
        this.EventInit()
        const n:NodeProxy = {
            shellReply: this.shellReply,
            folderReply: this.folderReply
        }
        this.websocket_manager = new Execute_SocketManager.WebsocketManager(this.NewConnection, this.DisConnection, this.Analysis, messager_log, n)
        this.console = new UtilServer_Console.Util_Server_Console()
        this.updatehandle = setInterval(() => {
            this.re.push(...this.console_update())
        }, RENDER_UPDATETICK);
    }

    private NewConnection = (x:WebsocketPack) => {
        const p = {
            title: "", //i18n.global.t('toast.connection-create-title'),
            type: 'success',
            message: "", //`${i18n.global.t('toast.connection-create-des')}: ${x.websocket.url} \n${x.uuid}`
        }
        mainWindow?.webContents.send('makeToast', p)
        this.execute_manager.forEach(y => {
            y.manager!.NewConnection(x)
        })
    }

    private DisConnection = (x:WebsocketPack) => {
        const p = {
            title: "", //i18n.global.t('toast.connection-remove-title'),
            type: 'error',
            message: "", //`${i18n.global.t('toast.connection-remove-des')}: ${x.websocket.url} \n${x.uuid}`
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
        mainWindow?.webContents.send('shellReply', data)
    }

    private folderReply = (data:ShellFolder) => {
        mainWindow?.webContents.send('folderReply', data)
    }

    private resource_start = (uuid:string) => {
        const p = this.websocket_manager!.targets.find(x => x.uuid == uuid)
        const d:Header = { name: 'resource_start', data: 0 }
        p?.websocket.send(JSON.stringify(d))
    }

    private resource_end = (uuid:string) => {
        const p = this.websocket_manager!.targets.find(x => x.uuid == uuid)
        const d:Header = { name: 'resource_end', data: 0 }
        p?.websocket.send(JSON.stringify(d))
    }

    private plugin_info = (uuid:string) => {
        const p = this.websocket_manager!.targets.find(x => x.uuid == uuid)
        const d:Header = { name: 'plugin_info', data: 0 }
        p?.websocket.send(JSON.stringify(d))
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
        const logss = this.backend.memory.logs.filter(x => x.dirty && x.output)
        logss.forEach(x => x.dirty = false)
        mainWindow?.webContents.send("logUpdate", JSON.stringify(logss))
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
        const r = this.execute_manager[index].manager!.uuid
        this.execute_manager.splice(index, 1)
        mainWindow?.webContents.send('console-delete', r)
    }

    private console_skip = (uuid:string, forward:boolean, type:number, state:ExecuteState = ExecuteState.FINISH) => {
        const target = this.execute_manager.find(x => x.record!.uuid == uuid)
        if(target == undefined) return
        if(type == 0){
            // Project
            target.record!.project_state[target.record!.project_index].state = forward ? (state != undefined ? state : ExecuteState.FINISH) : ExecuteState.NONE
            target.record!.project_index += forward ? 1 : -1
            if(target.record!.project_index == target.record!.projects.length) {
                target.record!.project_index = -1
                this.console_clean(uuid)
            }
            else {
                if(target.record!.project_index < 0){
                    target.record!.project_index = 0
                }
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
                const index = forward ? target.manager!.SkipProject() : target.manager!.PreviousProject()
                console.log("%s project, index: %d, next count: %d", forward ? "Skip" : "Previous", index, count)
            }
        }else if (type == 1){
            const begining = target.record!.task_state[0].state == ExecuteState.NONE
            // Task
            if(!begining && forward) target.record!.task_state[target.record!.task_index].state = state != undefined ? state : ExecuteState.FINISH
            if(!forward) target.record!.task_state[target.record!.task_index].state = ExecuteState.NONE
            target.record!.task_index += forward ? 1 : -1
            if(target.record!.task_index == target.record!.task_state.length) {
                this.console_skip(uuid, true, 0)
            }else{
                if(!begining && forward) target.record!.task_state[target.record!.task_index].state = state != undefined ? state : ExecuteState.FINISH
                else if (!forward) target.record!.task_state[target.record!.task_index].state = ExecuteState.RUNNING
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
                const index = forward ? target.manager!.SkipTask() : target.manager!.PreviousTask()
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
        // Resource
        ipcMain.on('resource_start', (e, uuid) => {
            this.resource_start(uuid)
        })
        ipcMain.on('resource_end', (e, uuid) => {
            this.resource_end(uuid)
        })
        ipcMain.on('plugin_info', (e, uuid) => {
            this.plugin_info(uuid)
        })
        // Shell
        ipcMain.on('shell_enter', (e, uuid, value) => {
            this.websocket_manager!.shell_enter(uuid, value)
        })
        ipcMain.on('shell_open', (e, uuid) => {
            this.websocket_manager!.shell_open(uuid)    
        })
        ipcMain.on('shell_close', (e, uuid) => {
            this.websocket_manager!.shell_close(uuid) 
        })
        ipcMain.on('shell_folder', (e, uuid, path) => {
            this.websocket_manager!.shell_folder(uuid, path)    
        })
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
        ipcMain.on('console_skip', (event, uuid:string, forward:boolean, type:number, state:ExecuteState) => {
            this.console_skip(uuid, forward, type, state)
        })
        ipcMain.on('console_skip2', (event, uuid:string, type:number) => {
            this.console_skip2(uuid, type)
        })
        ipcMain.handle('console_add', (event, name:string, record:Record) => {
            record.projects.forEach(x => x.uuid = uuidv6())
            const em:Execute_ExecuteManager.ExecuteManager = new Execute_ExecuteManager.ExecuteManager(
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
            em.libs = { libs: this.backend.memory.libs }
            const p:ExecutePair = { manager: em, record: er }
            const uscp:UtilServer_Console.Util_Server_Console_Proxy = new UtilServer_Console.Util_Server_Console_Proxy(p)
            const uslp:UtilServer_Log.Util_Server_Log_Proxy = new UtilServer_Log.Util_Server_Log_Proxy(p, { logs: this.backend.memory.logs }, this.preference!)
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
            executeProjectStart: (data:[Project, number]):void => { eps.forEach(x => x.executeProjectStart(JSON.parse(JSON.stringify(data)))) },
            executeProjectFinish: (data:[Project, number]):void => { eps.forEach(x => x.executeProjectFinish(JSON.parse(JSON.stringify(data)))) },
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