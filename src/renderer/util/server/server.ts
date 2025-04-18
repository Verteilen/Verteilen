import { Emitter } from "mitt";
import { nextTick, Ref } from "vue";
import { AppConfig, BusType, ExecuteRecord, Libraries, Node, NodeTable, Project, Record, Task } from "../../interface";
import { ExecuteManager } from "../../script/execute_manager";
import { WebsocketManager } from "../../script/socket_manager";
import { Util_Server_Job } from "./job_handle";
import { Util_Server_Node } from "./node_handle";
import { Util_Server_Parameter } from "./parameter_handle";
import { Util_Server_Project } from "./project_handle";
import { Util_Server_Task } from "./task_handle";

export type save_and_update = () => void
type config_getter = () => AppConfig

export interface DATA {
    websocket_manager: WebsocketManager | undefined
    execute_manager: Array<ExecuteManager>

    page:number
    lanSelect: string
    projects: Array<Project>
    projects_exe: ExecuteRecord
    libs: Libraries
    selectProject: Project | undefined
    selectTask: Task | undefined
    nodes: Array<NodeTable>
}

export class Util_Server {
    data:Ref<DATA>
    config:config_getter
    emitter:Emitter<BusType>

    project:Util_Server_Project
    task:Util_Server_Task
    job:Util_Server_Job
    node:Util_Server_Node
    parameter:Util_Server_Parameter

    constructor(_data:Ref<DATA>, _config:config_getter, _emitter:Emitter<BusType>){
        this.data = _data
        this.config = _config
        this.emitter = _emitter
        this.project = new Util_Server_Project(this.data, this.allUpdate, this.update, _emitter)
        this.task = new Util_Server_Task(this.data, this.allUpdate, this.update)
        this.job = new Util_Server_Job(this.data, this.update)
        this.node = new Util_Server_Node(this.data, this.saveRecord)
        this.parameter = new Util_Server_Parameter(this.data, this.update)
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
            this.emitter.emit('updateParameter')
        })
    }
    
    saveRecord = ():Record => {
        const record:Record = {
            projects: this.data.value.projects,
            nodes: this.data.value.nodes as Array<Node>
        }
        const k = JSON.stringify(record, null, 4)
        if(this.config().isElectron) window.electronAPI.send('save_record', k)
        return record
    }
}