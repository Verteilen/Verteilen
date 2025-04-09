import { Emitter } from "mitt";
import { inject, nextTick, Ref } from "vue";
import { AppConfig, BusType, ExecuteProxy, ExecuteRecord, ExecuteState, FeedBack, Job, Libraries, Node, NodeTable, Parameter, Project, Record, ShellFolder, Single, Task } from "../../interface";
import { ConsoleManager } from "../../script/console_manager";
import { ExecuteManager } from "../../script/execute_manager";
import { WebsocketManager } from "../../script/socket_manager";
import { Util_Server_Job } from "./job_handle";
import { Util_Server_Node } from "./node_handle";
import { Util_Server_Parameter } from "./parameter_handle";
import { Util_Server_Project } from "./project_handle";
import { Util_Server_Task } from "./task_handle";

export type save_and_update = () => void
type config_getter = () => AppConfig

const emitter:Emitter<BusType> | undefined = inject('emitter');

export const execute_proxy:ExecuteProxy = {
    executeProjectStart: (data:Project):void => { emitter?.emit('executeProjectStart', data) },
    executeProjectFinish: (data:Project):void => { emitter?.emit('executeProjectFinish', data) },
    executeTaskStart: (data:[Task, number]):void => { emitter?.emit('executeTaskStart', data) },
    executeTaskFinish: (data:Task):void => { emitter?.emit('executeTaskFinish', data) },
    executeSubtaskStart: (data:[Task, number, string]):void => { emitter?.emit('executeSubtaskStart', data) },
    executeSubtaskUpdate: (data:[Task, number, string, ExecuteState]):void => { emitter?.emit('executeSubtaskUpdate', data) },
    executeSubtaskFinish: (data:[Task, number, string]):void => { emitter?.emit('executeSubtaskFinish', data) },
    executeJobStart: (data:[Job, number, string]):void => { emitter?.emit('executeJobStart', data) },
    executeJobFinish: (data:[Job, number, string, number]):void => { emitter?.emit('executeJobFinish', data) },
    feedbackMessage: (data:FeedBack):void => { emitter?.emit('feedbackMessage', data) },
    updateParameter: (data:Parameter):void => { emitter?.emit('updateRuntimeParameter', data) },
    shellReply: (data:Single):void => { emitter?.emit('shellReply', data) },
    folderReply: (data:ShellFolder) => { emitter?.emit('folderReply', data) }
}

export interface DATA {
    websocket_manager: WebsocketManager | undefined
    execute_manager: Array<ExecuteManager>
    console_manager: ConsoleManager | undefined

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
    project:Util_Server_Project
    task:Util_Server_Task
    job:Util_Server_Job
    node:Util_Server_Node
    parameter:Util_Server_Parameter

    constructor(_data:Ref<DATA>, _config:config_getter){
        this.data = _data
        this.config = _config
        this.project = new Util_Server_Project(this.data, this.update)
        this.task = new Util_Server_Task(this.data, this.update)
        this.job = new Util_Server_Job(this.data, this.update)
        this.node = new Util_Server_Node(this.data, this.update)
        this.parameter = new Util_Server_Parameter(this.data, this.update)
    }

    private update = () => {
        this.allUpdate()
        this.saveRecord()
    }

    allUpdate = () => {
        nextTick(() => {
            emitter?.emit('updateProject')
            emitter?.emit('updateTask')
            emitter?.emit('updateJob')
            emitter?.emit('updateParameter')
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