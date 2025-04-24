import { v6 as uuid6 } from 'uuid'
import { AppConfig, ConditionResult, ExecuteProxy, ExecuteRecord, ExecuteState, ExecutionLog, FeedBack, Job, JobCategory, Log, Parameter, Preference, Project, Task } from "../../interface"
import { ExecuteManager } from "../../script/execute_manager"

export class Util_Server_Log_Proxy {
    model:[ExecuteManager, ExecuteRecord]
    logs:Log
    preference:Preference
    config:AppConfig

    private task_index:number = 0

    constructor(_model:[ExecuteManager, ExecuteRecord], _log:Log, _preference:Preference, _config:AppConfig){
        this.model = _model
        this.logs = _log
        this.preference = _preference
        this.config = _config
    }

    public get execute_proxy() : ExecuteProxy {
        const d:ExecuteProxy = {
            executeProjectStart: (data:Project):void => { this.execute_project_start(data) },
            executeProjectFinish: (data:Project):void => { this.execute_project_finish(data) },
            executeTaskStart: (data:[Task, number]):void => { this.execute_task_start(data) },
            executeTaskFinish: (data:Task):void => { this.execute_task_finish(data) },
            executeSubtaskStart: (data:[Task, number, string]):void => { this.execute_subtask_start(data) },
            executeSubtaskUpdate: (data:[Task, number, string, ExecuteState]):void => { this.execute_subtask_update(data) },
            executeSubtaskFinish: (data:[Task, number, string]):void => { this.execute_subtask_end(data) },
            executeJobStart: (data:[Job, number, string]):void => { this.execute_job_start(data) },
            executeJobFinish: (data:[Job, number, string, number]):void => { this.execute_job_finish(data) },
            feedbackMessage: (data:FeedBack):void => { this.feedback_message(data) },
            updateParameter: (data:Parameter):void => { this.update_runtime_parameter(data) }
        }
        return d
    }

    execute_project_start = async (d:Project) => {
        if(!this.preference.log) return
        const target = this.model[1].projects[this.model[1].project_index]
        const title = await this.getnewname(target.title)
        const newlog:ExecutionLog = {
            uuid: uuid6(),
            filename: title,
            dirty: true,
            output: this.preference.log,
            project: target,
            state: ExecuteState.RUNNING,
            start_timer: Date.now(),
            parameter: d.parameter!,
            end_timer: 0,
            logs: target.task.map(x => {
                return {
                    start_timer: 0,
                    end_timer: 0,
                    task_state: {
                        uuid: x.uuid,
                        state: ExecuteState.NONE
                    },
                    task_detail: []
                }
            })
        }
        this.logs.logs = [newlog].concat(this.logs.logs)
        console.log("Debug Log", this.logs)
    }

    execute_project_finish = (d:Project) => {
        if(!this.preference.log) return
        this.logs.logs[0].state = ExecuteState.FINISH
        this.logs.logs[0].end_timer = Date.now()
        this.logs.logs[0].dirty = true
    }
    
    execute_task_start = (d:[Task, number]) => {
        if(!this.preference.log) return
        const index = this.logs.logs[0].project.task.findIndex(x => x.uuid == d[0].uuid)
        if(index == -1) return
        this.task_index = index
        this.logs.logs[0].logs[this.task_index].task_detail = []
    
        const p = this.model[1].projects[this.model[1].project_index]
        const t = p.task[this.task_index]
        const count = this.model[0].get_task_state_count(t)
        
        for(let i = 0; i < count; i++){
            this.logs.logs[0].logs[this.task_index].task_detail.push({
                index: i,
                node: "",
                message: [],
                state: ExecuteState.NONE
            })
        }
    
        if(!this.preference.log) return
        if(this.logs.logs[0].logs.length > this.task_index){
            this.logs.logs[0].logs[this.task_index].task_state.state = ExecuteState.RUNNING
            this.logs.logs[0].logs[this.task_index].start_timer = Date.now()
            this.logs.logs[0].dirty = true
        }
    }
    
    execute_task_finish = (d:Task) => {
        if(!this.preference.log) return
        if(this.logs.logs[0].logs.length > this.task_index){
            this.logs.logs[0].logs[this.task_index].task_state.state = ExecuteState.FINISH
            this.logs.logs[0].logs[this.task_index].end_timer = Date.now()
            this.logs.logs[0].dirty = true
        }
    }
    
    execute_subtask_start = (d:[Task, number, string]) => {
        if(!this.preference.log) return
        if(this.logs.logs[0].logs[this.task_index].task_detail.length > d[1]){
            this.logs.logs[0].logs[this.task_index].task_detail[d[1]].state = ExecuteState.RUNNING
            this.logs.logs[0].dirty = true
        }
    }
    
    execute_subtask_update = (d:[Task, number, string, ExecuteState]) => {
        if(!this.preference.log) return
        if(this.logs.logs[0].logs[this.task_index].task_detail.length > d[1]){
            this.logs.logs[0].logs[this.task_index].task_detail[d[1]].state = d[3]
            this.logs.logs[0].dirty = true
        }
    }
    
    execute_subtask_end = (d:[Task, number, string]) => {
        if(!this.preference.log) return
        if(this.logs.logs[0].logs[this.task_index].task_detail.length > d[1]){
            this.logs.logs[0].logs[this.task_index].task_detail[d[1]].state = ExecuteState.FINISH
            this.logs.logs[0].dirty = true
        }
    }
    
    execute_job_start = (d:[Job, number, string]) => {
    
    }
    
    execute_job_finish = (d:[Job, number, string, number]) => {
        if(!this.preference.log) return
        if (d[3] == 1){
            const currentLog = this.logs.logs[0]
            const task = currentLog.project.task[this.task_index]
            const index = task.jobs.findIndex(x => x.uuid == d[0].uuid)
            if(index != -1 && task.jobs[index].category == JobCategory.Condition){
                const cr:ConditionResult = task.jobs[index].number_args[0] as ConditionResult
                if(cr == ConditionResult.None) return
                const state = (cr == ConditionResult.ThrowTask || cr == ConditionResult.ThrowProject) ? ExecuteState.ERROR : ExecuteState.SKIP
                currentLog.logs[this.task_index].task_detail[d[1]].state = state
                currentLog.logs[this.task_index].task_state.state = state
                if (cr == ConditionResult.Pause) return
                if (cr == ConditionResult.SkipProject || cr == ConditionResult.ThrowProject){
                    currentLog.state = state
                }
            }
        }
    }
    
    feedback_message = (d:FeedBack) => {
        if(!this.preference.log) return
        if(d.index == undefined || d.index == -1) return
        if(!this.preference.log) return
        if(this.logs.logs[0].logs[this.task_index].task_detail.length > d.index){
            this.logs.logs[0].logs[this.task_index].task_detail[d.index].message.push(d.message)
            this.logs.logs[0].dirty = true
        }else{
            console.warn("Try access message by index but failed: ", d)
        }
    }

    update_runtime_parameter = (d:Parameter) => {
        if(this.logs.logs.length > 0) {
            this.logs.logs[0].parameter = d
            this.logs.logs[0].dirty = true
        }
    }

    getnewname = async (name:string) => {
        if(!this.config.isElectron) return name
        const root = "data/log"
        let count = 0
        let filename = name
        let p = `${root}/${filename}`
        while(await window.electronAPI.invoke('exist', p + ".json")){
            count = count + 1
            filename = `${name} ${count}`
            p = `${root}/${filename}`
        }
        return filename
    }
}