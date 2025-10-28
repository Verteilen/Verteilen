//#region Methods
import { Emitter } from "mitt"
import { nextTick, Ref } from "vue"
import { BackendProxy } from "../../proxy";
import { 
    Execute_SocketManager,
    BusType, 
    ClientLog, 
    ExecutePair, 
    ExecuteProxy, 
    ExecuteState, 
    FeedBack, 
    Job, 
    NodeTable, 
    Database, 
    PluginPageData, 
    Project, 
    RenderUpdateType, 
    Task, 
    ProjectTable,
    DatabaseTable,
    ExecutionLog,
    Library
} from '../../interface'
import {
    Server
} from 'verteilen-core/src/server'
import { Util_Server_Console } from "./console_handle";
import { Util_Server_Job } from "./job_handle";
import { Util_Server_Lib } from "./lib_handle";
import { Util_Server_Node } from "./node_handle";
import { Util_Server_Database } from "./database_handle";
import { Util_Server_Project } from "./project_handle";
import { Util_Server_Self } from "./self_handle";
import { Util_Server_Task } from "./task_handle";
//#endregion

export type save_and_update = () => void
export type config_getter = () => BackendProxy

export interface DATA {
    websocket_manager: Execute_SocketManager.WebsocketManager | undefined
    execute_manager: Array<ExecutePair>

    loading: boolean
    drawer: boolean
    title: string
    page:number
    select_manager: number
    lanSelect: string
    databases: Array<DatabaseTable>
    projects: Array<ProjectTable>
    libs: Array<Library>
    logs: Array<ExecutionLog>
    selectProject: Project | undefined
    selectTask: Task | undefined
    selectDatabase: Database | undefined
    nodes: Array<NodeTable>
    messages: Array<ClientLog>
    plugin: PluginPageData
}

/**
 * **Frontend Page Logic Controller**\
 * This worker have deep binding with data\
 * And also have deep connection with the views display logic
 */
export class Util_Server extends Server {
    data:Ref<DATA>
    config:config_getter
    emitter:Emitter<BusType>

    project:Util_Server_Project
    task:Util_Server_Task
    job:Util_Server_Job
    node:Util_Server_Node
    database:Util_Server_Database
    console:Util_Server_Console
    lib:Util_Server_Lib
    self:Util_Server_Self

    constructor(_data:Ref<DATA>, _config:config_getter, _emitter:Emitter<BusType>){
        super()
        this.data = _data
        this.config = _config
        this.emitter = _emitter
        this.project = new Util_Server_Project(this.data, this.config, this.allUpdate, this.update, _emitter)
        this.task = new Util_Server_Task(this.data, this.allUpdate, this.update)
        this.job = new Util_Server_Job(this.data, this.update)
        this.node = new Util_Server_Node(this.data, this.saveRecord)
        this.database = new Util_Server_Database(this.data, this.config, this.update)
        this.console = new Util_Server_Console()
        this.lib = new Util_Server_Lib(this.data, this.update)
        this.self = new Util_Server_Self(this.data)
    }

    private update = () => {
        this.allUpdate()
        this.saveRecord()
    }

    allUpdate = () => {
        nextTick(() => {
            this.emitter.emit('updateProject')
            this.emitter.emit('updateTask')
            this.emitter.emit('updateJob')
            this.emitter.emit('updateDatabase')
        })
    }
    
    saveRecord = (type:RenderUpdateType = RenderUpdateType.All) => {
        if((type & RenderUpdateType.Project) == RenderUpdateType.Project){
            for(const x of this.data.value.projects){
                const text = JSON.stringify(x)
                this.config().send('save_record', x.uuid, text)
            }
        }
        if((type & RenderUpdateType.Node) == RenderUpdateType.Node){
            for(const x of this.data.value.nodes){
                const text = JSON.stringify(x)
                this.config().send('save_node', x.uuid, text)
            }
        }
        if((type & RenderUpdateType.Database) == RenderUpdateType.Database){
            for(const x of this.data.value.databases){
                const text = JSON.stringify(x)
                this.config().send('save_database', x.uuid, text)
            }
        }
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
            updateDatabase: (data:Database):void => { eps.forEach(x => x.updateDatabase(JSON.parse(JSON.stringify(data)))) },
        }
        return p
    }
}
