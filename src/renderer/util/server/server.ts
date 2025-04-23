import { Emitter } from "mitt";
import { nextTick, Ref } from "vue";
import { BusType, ExecuteProxy, ExecuteRecord, ExecuteState, FeedBack, Job, Libraries, Log, NodeTable, Parameter, Project, RenderUpdateType, Task } from "../../interface";
import { BackendProxy } from "../../proxy";
import { ExecuteManager } from "../../script/execute_manager";
import { WebsocketManager } from "../../script/socket_manager";
import { Util_Server_Console } from "./console_handle";
import { Util_Server_Job } from "./job_handle";
import { Util_Server_Node } from "./node_handle";
import { Util_Server_Parameter } from "./parameter_handle";
import { Util_Server_Project } from "./project_handle";
import { Util_Server_Task } from "./task_handle";

export type save_and_update = () => void
export type config_getter = () => BackendProxy

export interface DATA {
    websocket_manager: WebsocketManager | undefined
    execute_manager: Array<[ExecuteManager, ExecuteRecord]>

    page:number
    select_manager: number
    lanSelect: string
    parameters: Array<Parameter>
    projects: Array<Project>
    libs: Libraries
    logs: Log
    selectProject: Project | undefined
    selectTask: Task | undefined
    selectParameter: Parameter | undefined
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
    console:Util_Server_Console

    constructor(_data:Ref<DATA>, _config:config_getter, _emitter:Emitter<BusType>){
        this.data = _data
        this.config = _config
        this.emitter = _emitter
        this.project = new Util_Server_Project(this.data, this.config, this.allUpdate, this.update, _emitter)
        this.task = new Util_Server_Task(this.data, this.allUpdate, this.update)
        this.job = new Util_Server_Job(this.data, this.update)
        this.node = new Util_Server_Node(this.data, this.saveRecord)
        this.parameter = new Util_Server_Parameter(this.data, this.config, this.update)
        this.console = new Util_Server_Console(this.data, this.update)
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
    
    saveRecord = (type:RenderUpdateType = RenderUpdateType.All) => {
        if((type & RenderUpdateType.Project) == RenderUpdateType.Project){
            this.data.value.projects.forEach(x => {
                if(!this.config().config.isElectron) return
                const text = JSON.stringify(x)
                window.electronAPI.send('save_record', x.uuid, text)
            })
        }
        if((type & RenderUpdateType.Node) == RenderUpdateType.Node){
            this.data.value.nodes.forEach(x => {
                if(!this.config().config.isElectron) return
                const text = JSON.stringify(x)
                window.electronAPI.send('save_node', x.ID, text)
            })
        }
        if((type & RenderUpdateType.Parameter) == RenderUpdateType.Parameter){
            this.data.value.parameters.forEach(x => {
                if(!this.config().config.isElectron) return
                const text = JSON.stringify(x)
                window.electronAPI.send('save_parameter', x.uuid, text)
            })
        }
    }

    CombineProxy = (eps:Array<ExecuteProxy>) => {
        const p:ExecuteProxy = {
            executeProjectStart: (data:Project):void => { eps.map(x => x.executeProjectStart(data)) },
            executeProjectFinish: (data:Project):void => { eps.map(x => x.executeProjectFinish(data)) },
            executeTaskStart: (data:[Task, number]):void => { eps.map(x => x.executeTaskStart(data)) },
            executeTaskFinish: (data:Task):void => { eps.map(x => x.executeTaskFinish(data)) },
            executeSubtaskStart: (data:[Task, number, string]):void => { eps.map(x => x.executeSubtaskStart(data)) },
            executeSubtaskUpdate: (data:[Task, number, string, ExecuteState]):void => { eps.map(x => x.executeSubtaskUpdate(data)) },
            executeSubtaskFinish: (data:[Task, number, string]):void => { eps.map(x => x.executeSubtaskFinish(data)) },
            executeJobStart: (data:[Job, number, string]):void => { eps.map(x => x.executeJobStart(data)) },
            executeJobFinish: (data:[Job, number, string, number]):void => { eps.map(x => x.executeJobFinish(data)) },
            feedbackMessage: (data:FeedBack):void => { eps.map(x => x.feedbackMessage(data)) },
            updateParameter: (data:Parameter):void => { eps.map(x => x.updateParameter(data)) },
        }
        return p
    }
}
