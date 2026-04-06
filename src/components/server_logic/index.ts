//#region Methods
import { Emitter } from "mitt"
import { ComputedRef, Ref } from "vue"
import { BackendProxy } from "../../proxy";
import { 
    AppConfig,
    BusType, 
    ClientLog, 
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
    FrontendUpdate,
    MemoryData,
} from 'verteilen-core'
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
export class Util_Server {
    data:Ref<DATA>
    emitter:Emitter<BusType>
    backend:Ref<BackendProxy>
    preference:Ref<Preference>
    memory: MemoryData = {
        projects: [],
        tasks: [],
        jobs: [],
        database: [],
        nodes: [],
        logs: [],
        libs: [],
        user: [],
    }

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

    config: ComputedRef<AppConfig>
    selectProject:ComputedRef<ProjectTable | undefined>
    selectTask:ComputedRef<TaskTable | undefined>
    selectDatabase:ComputedRef<DatabaseTable | undefined>

    constructor(data:Ref<DATA>,
        emitter:Emitter<BusType>,
        backend:Ref<BackendProxy>,
        preference:Ref<Preference>,
        config: ComputedRef<AppConfig>,
        selectProject:ComputedRef<ProjectTable | undefined>,
        selectTask:ComputedRef<TaskTable | undefined>,
        selectDatabase:ComputedRef<DatabaseTable | undefined>
        )
    {
        this.data = data
        this.emitter = emitter
        this.backend = backend
        this.preference = preference
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
        this.config = config
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
        this.query.load_all_node()
        switch(v){
            case 0: // project
                {
                    this.query.load_all_project()
                    this.query.load_all_plugin()
                    break
                }
            case 1: // task
                {
                    this.query.load_all_database()
                    if(this.selectProject.value != undefined){
                        this.query.load_tasks(this.selectProject.value.uuid)
                    }else{
                        this.data.value.tasks = []
                    }
                    break
                }
            case 2: // job
                {
                    if(this.selectTask.value != undefined){
                        this.query.load_jobs(this.selectTask.value.uuid)
                        this.query.load_task(this.selectTask.value.uuid)
                    }else{
                        this.data.value.jobs = []
                    }
                    break
                }
            case 3: // database
                {
                    this.query.load_all_database()
                    this.query.load_all_plugin()
                    break
                }
            case 4: //
                {
                    //this.query.load_all_node()
                }
            case 11: // plugin
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

    GetTab = ():Array<[string, string, number]> => {
        let tabs:Array<[string, string, number]> = []
        if(this.config.value.haveBackend){
            // In express mode, we will need to check permission first
            tabs = [
                ["", "toolbar.editor", -1],
                ["mdi-cube", "toolbar.project", 0],
            ]
            if(this.backend.value.user.permission?.task.view) tabs.push(["mdi-calendar", "toolbar.task", 1])
            if(this.backend.value.user.permission?.job.view) tabs.push(["mdi-hammer", "toolbar.job", 2])
            if(this.backend.value.user.permission?.database.view) tabs.push(["mdi-database", "toolbar.database", 3])
            tabs.push(["", "toolbar.compute", -1])
            if(this.backend.value.user.permission?.service.view) tabs.push(["mdi-play-network", "toolbar.service", 10])
            if(this.backend.value.user.permission?.node.view) tabs.push(["mdi-network", "toolbar.node", 4])
            if(this.backend.value.user.permission?.execute_job) tabs.push(["mdi-console-line", "toolbar.console", 5])
        }else{
            // If electron or browser
            tabs = [
                ["", "toolbar.editor", -1],
                ["mdi-cube", "toolbar.project", 0],
                ["mdi-calendar", "toolbar.task", 1],
                ["mdi-hammer", "toolbar.job", 2],
                ["mdi-database", "toolbar.database", 3],
                ["", "toolbar.compute", -1],
                ["mdi-play-network", 'toolbar.service', 10],
                ["mdi-network", "toolbar.node", 4],
                ["mdi-console-line", "toolbar.console", 5],
            ]
        }
        
        if(this.config.value.haveBackend){
            if((this.config.value.haveBackend && this.backend.value.user.permission?.plugin.view) || !this.config.value.haveBackend) tabs.push(["mdi-puzzle", "toolbar.plugin", 11])
            tabs.push(["", "toolbar.backend", -1])
            if((this.config.value.haveBackend && this.backend.value.user.permission?.log.view) || !this.config.value.haveBackend) tabs.push(["mdi-text-box-outline", "toolbar.log", 6])
            if((this.config.value.haveBackend && this.backend.value.user.permission?.lib.view) || !this.config.value.haveBackend) tabs.push(["mdi-xml", "toolbar.library", 7])
        }
        // Only admin or electron user can access self client
        if(this.config.value.haveBackend && this.config.value.isAdmin) tabs.push(["mdi-nodejs", "toolbar.client", 8])
        if(this.config.value.haveBackend && this.config.value.isAdmin){
            // Some admin tool to view
            tabs.push(["", "toolbar.server", -1])
            tabs.push(["mdi-lock", "toolbar.role", 9])
        }
        return tabs
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
