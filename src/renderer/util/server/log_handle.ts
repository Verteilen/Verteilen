import { v6 as uuid6 } from 'uuid'
import { ConditionResult, ExecutePair, ExecuteProxy, ExecuteRecordTask, ExecuteState, ExecutionLog, FeedBack, Job, JobCategory, Log, Parameter, Preference, Project, Task } from "../../interface"
import * as fs from 'fs'

export class Util_Server_Log_Proxy {
    model:ExecutePair
    logs:Log
    preference:Preference

    private task_index:number = 0
    private uuid:string = ''
    private get target_log ():ExecutionLog | undefined {
        return this.logs.logs.find(x => x.uuid == this.uuid)!
    }

    constructor(_model:ExecutePair, _log:Log, _preference:Preference){
        this.model = _model
        this.logs = _log
        this.preference = _preference
    }

    public get execute_proxy() : ExecuteProxy {
        const d:ExecuteProxy = {
            executeProjectStart: (data:[Project, number]):void => { this.execute_project_start(data) },
            executeProjectFinish: (data:[Project, number]):void => { this.execute_project_finish(data) },
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

    execute_project_start = async (d:[Project, number]) => {
        const target = this.model.record!.projects[this.model.record!.project_index]
        const title = await this.getnewname(target.title)
        this.uuid = uuid6()
        const newlog:ExecutionLog = {
            uuid: this.uuid,
            filename: title,
            dirty: true,
            output: this.preference.log,
            project: target,
            state: ExecuteState.RUNNING,
            start_timer: Date.now(),
            parameter: d[0].parameter!,
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
    }

    execute_project_finish = (d:[Project, number]) => {
        if(this.target_log == undefined) return
        this.target_log!.state = ExecuteState.FINISH
        this.target_log!.end_timer = Date.now()
        this.target_log!.dirty = true
    }
    
    execute_task_start = (d:[Task, number]) => {
        if(this.target_log == undefined) return
        const index = this.target_log!.project.task.findIndex(x => x.uuid == d[0].uuid)
        if(index == -1) return
        this.task_index = index
        this.target_log!.logs[this.task_index].task_detail = []
    
        const p = this.model.record!.projects[this.model.record!.project_index]
        const t = p.task[this.task_index]
        const count = this.model.manager!.get_task_state_count(t)
        
        for(let i = 0; i < count; i++){
            this.target_log!.logs[this.task_index].task_detail.push({
                index: i,
                node: "",
                message: [],
                state: ExecuteState.NONE
            })
        }
    
        if(this.target_log!.logs.length > this.task_index){
            this.target_log!.logs[this.task_index].task_state.state = ExecuteState.RUNNING
            this.target_log!.logs[this.task_index].start_timer = Date.now()
            this.target_log!.dirty = true
        }
    }
    
    execute_task_finish = (d:Task) => {
        if(this.target_log == undefined) return
        if(this.target_log!.logs.length > this.task_index){
            this.target_log!.logs[this.task_index].task_state.state = ExecuteState.FINISH
            this.target_log!.logs[this.task_index].end_timer = Date.now()
            this.target_log!.dirty = true
        }
    }
    
    execute_subtask_start = (d:[Task, number, string]) => {
        if(this.target_log == undefined) return
        if(this.target_log!.logs[this.task_index].task_detail.length > d[1]){
            this.target_log!.logs[this.task_index].task_detail[d[1]].state = ExecuteState.RUNNING
            this.target_log!.dirty = true
        }
    }
    
    execute_subtask_update = (d:[Task, number, string, ExecuteState]) => {
        if(this.target_log == undefined) return
        if(this.target_log!.logs[this.task_index].task_detail.length > d[1]){
            this.target_log!.logs[this.task_index].task_detail[d[1]].state = d[3]
            this.target_log!.dirty = true
        }
    }
    
    execute_subtask_end = (d:[Task, number, string]) => {
        if(this.target_log == undefined) return
        if(this.target_log!.logs[this.task_index].task_detail.length > d[1]){
            this.target_log!.logs[this.task_index].task_detail[d[1]].state = ExecuteState.FINISH
            this.target_log!.dirty = true
        }
    }
    
    execute_job_start = (d:[Job, number, string]) => {
    
    }
    
    execute_job_finish = (d:[Job, number, string, number]) => {
        if(this.target_log == undefined) return
        if (d[3] == 1){
            const currentLog = this.target_log!
            const task = currentLog.project.task[this.task_index]
            const index = task.jobs.findIndex(x => x.uuid == d[0].uuid)
            if(index != -1 && task.jobs[index].category == JobCategory.Condition){
                const cr:ConditionResult = task.jobs[index].number_args[0] as ConditionResult
                if(cr == ConditionResult.None) return
                const state = (cr == ConditionResult.ThrowTask || cr == ConditionResult.ThrowProject) ? ExecuteState.ERROR : ExecuteState.SKIP
                const target: ExecuteRecordTask | undefined = this.model.record!.task_detail[d[1]]
                if(target != undefined) {
                    target.state = state
                }

                currentLog.logs[this.task_index].task_state.state = state
                if (cr == ConditionResult.Pause) return
                if (cr == ConditionResult.SkipProject || cr == ConditionResult.ThrowProject){
                    currentLog.state = state
                }
            }
        }
    }
    
    feedback_message = (d:FeedBack) => {
        if(this.target_log == undefined) return
        if(d.index == undefined || d.index == -1) return
        if(this.target_log == undefined) return
        if(this.target_log!.logs[this.task_index].task_detail.length > d.index){
            this.target_log!.logs[this.task_index].task_detail[d.index].message.push(d.message)
            this.target_log!.dirty = true
        }else{
            console.warn("Try access message by index but failed: ", d)
        }
    }

    update_runtime_parameter = (d:Parameter) => {
        if(this.target_log != undefined) {
            this.target_log!.parameter = d
            this.target_log!.dirty = true
        }
    }

    getnewname = async (name:string) => {
        const root = "data/log"
        let count = 0
        let filename = name
        let p = `${root}/${filename}`
        while(fs.existsSync(p + ".json")){
            count = count + 1
            filename = `${name} ${count}`
            p = `${root}/${filename}`
        }
        return filename
    }
}