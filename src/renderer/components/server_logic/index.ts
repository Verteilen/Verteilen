//#region Methods
import { Emitter } from "mitt"
import { ComputedRef, nextTick, Ref } from "vue"
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
    Task, 
    ProjectTable,
    DatabaseTable,
    ExecutionLog,
    Library,
    Preference,
    TaskTable,
    JobTable,
    FrontendUpdate
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
import { ServerQuery } from "./query";
import { ServerSave } from "./save";
import { ServerDelete } from "./delete";
import { Util_Server_Plugin } from "./plugin_handle";
//#endregion

export type save_and_update = () => void

export interface DATA {
    websocket_manager: Execute_SocketManager.WebsocketManager | undefined
    execute_manager: Array<ExecutePair>

    drawer: boolean
    title: string
    page:number
    select_manager: number
    lanSelect: string
    databases: Array<DatabaseTable>
    projects: Array<ProjectTable>
    tasks: Array<TaskTable>
    jobs: Array<JobTable>
    libs: Array<Library>
    logs: Array<ExecutionLog>
    selectProjectID: string
    selectTaskID: string
    selectDatabaseID: string
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
    emitter:Emitter<BusType>
    backend:Ref<BackendProxy>
    preference:Ref<Preference>
    server:Ref<Server | undefined>

    query:ServerQuery
    save:ServerSave
    del:ServerDelete
    project:Util_Server_Project
    task:Util_Server_Task
    job:Util_Server_Job
    node:Util_Server_Node
    database:Util_Server_Database
    console:Util_Server_Console
    lib:Util_Server_Lib
    plugins: Util_Server_Plugin
    self:Util_Server_Self

    selectProject:ComputedRef<ProjectTable | undefined>
    selectTask:ComputedRef<TaskTable | undefined>
    selectDatabase:ComputedRef<DatabaseTable | undefined>

    constructor(data:Ref<DATA>,
        emitter:Emitter<BusType>,
        backend:Ref<BackendProxy>,
        preference:Ref<Preference>,
        server:Ref<Server | undefined>,
        selectProject:ComputedRef<ProjectTable | undefined>,
        selectTask:ComputedRef<TaskTable | undefined>,
        selectDatabase:ComputedRef<DatabaseTable | undefined>
        )
    {
        super()
        this.data = data
        this.emitter = emitter
        this.backend = backend
        this.preference = preference
        this.server = server
        this.query = new ServerQuery(this)
        this.save = new ServerSave(this)
        this.del = new ServerDelete(this)
        this.project = new Util_Server_Project(this)
        this.task = new Util_Server_Task(this)
        this.job = new Util_Server_Job(this)
        this.node = new Util_Server_Node(this)
        this.database = new Util_Server_Database(this)
        this.console = new Util_Server_Console()
        this.lib = new Util_Server_Lib(this.data, this.update)
        this.plugins = new Util_Server_Plugin(this)
        this.self = new Util_Server_Self(this.data)
        this.selectProject = selectProject
        this.selectTask = selectTask
        this.selectDatabase = selectDatabase
    }

    update = () => {
        this.allUpdate()
        this.saveRecord()
    }

    allUpdate = () => {
        
    }

    /**
     * Change the backend observe patterm\
     * Backend should re submit different set of events
     * @param v new page number
     */
    page_update = (v:number) => {
        if(!this.backend.value.config.haveBackend) return
        this.backend.value.send("server_page", v)
        switch(v){
            case 0:
                {
                    this.query.load_all_project()
                    this.query.load_all_plugin()
                    break
                }
            case 1:
                {
                    if(this.selectProject.value != undefined){
                        this.query.load_tasks(this.selectProject.value.uuid)
                    }else{
                        this.data.value.tasks = []
                    }
                }
            case 2:
                {
                    if(this.selectTask.value != undefined){
                        this.query.load_jobs(this.selectTask.value.uuid)
                    }else{
                        this.data.value.jobs = []
                    }
                }
            case 3:
                {
                    this.query.load_all_database()
                    break
                }
            case 11:
                {
                    this.query.load_all_plugin()
                    break
                }
        }
    }
    
    saveRecord = (type:FrontendUpdate = FrontendUpdate.ALL) => {
        if((type & FrontendUpdate.PROJECT) == FrontendUpdate.PROJECT){
            for(const x of this.data.value.projects){
                const buffer:any = JSON.parse(JSON.stringify(x))
                if(x.s != undefined) delete buffer['s']
                const text = JSON.stringify(buffer)
                this.backend.value.send('save_record', x.uuid, text)
            }
        }
        if((type & FrontendUpdate.NODE) == FrontendUpdate.NODE){
            for(const x of this.data.value.nodes){
                const buffer:any = JSON.parse(JSON.stringify(x))
                if(x.s != undefined) delete buffer['s']
                if(x.state != undefined) delete buffer['state']
                if(x.connection_rate != undefined) delete buffer['connection_rate']
                if(x.plugins != undefined) delete buffer['plugins']
                if(x.system != undefined) delete buffer['system']
                const text = JSON.stringify(buffer)
                this.backend.value.send('save_node', x.uuid, text)
            }
        }
        if((type & FrontendUpdate.DATABASE) == FrontendUpdate.DATABASE){
            for(const x of this.data.value.databases){
                const buffer:any = JSON.parse(JSON.stringify(x))
                if(x.s != undefined) delete buffer['s']
                const text = JSON.stringify(buffer)
                this.backend.value.send('save_database', x.uuid, text)
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
