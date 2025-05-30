import { Ref } from "vue"
import { ConditionResult, ExecuteProxy, ExecuteRecord, ExecuteRecordTask, ExecuteState, FeedBack, Job, JobCategory, MESSAGE_LIMIT, Parameter, Project, Record, Task } from "../../interface"
import { ExecuteManager } from "../../script/execute_manager"
import { DATA, save_and_update } from "./server"

export class Util_Server_Console { 
    data:Ref<DATA>
    update:save_and_update
    
    constructor (_data:Ref<DATA>, _update:save_and_update){
        this.data = _data
        this.update = _update
    }

    receivedPack = (model:[ExecuteManager, ExecuteRecord], record:Record) => {
        const pass = model[0].Register()
        if(pass == -1){
            model[1].running = false
            model[1].stop = true
            return false
        }
        model[1].projects = record.projects
        model[1].nodes = record.nodes
        model[1].project_state = model[1].projects.map(x => {
            return {
                uuid: x.uuid,
                state: ExecuteState.NONE
            }
        })
        model[1].project_index = pass
        model[1].project = record.projects[pass].uuid
        model[1].task_index = 0
        model[1].task_state = model[1].projects[0].task.map(x => {
            return {
                uuid: x.uuid,
                state: ExecuteState.NONE
            }
        })
        model[1].task_state[0].state = ExecuteState.RUNNING
        model[1].task_detail = []
        const task = model[1].projects[model[1].project_index]?.task[model[1].task_index]
        const count = task.cronjob ? (task?.jobs.length ?? 0) : 1
        for(let i = 0; i < count; i++){
            model[1].task_detail.push({
                index: i,
                node: "",
                message: [],
                state: ExecuteState.NONE
            })
        }
        model[0].Update()
        return true
    }
}

export class Util_Server_Console_Proxy {
    model:[ExecuteManager, ExecuteRecord]

    constructor(_model:[ExecuteManager, ExecuteRecord]){
        this.model = _model
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

    execute_project_start = (d:Project) => {
        const index = this.model[1].projects.findIndex(x => x.uuid == d.uuid)
        if(index == -1) return
        this.model[1].project = d.uuid
        this.model[1].project_index = index
        this.model[1].project_state[index].state = ExecuteState.RUNNING
        this.model[1].task_state = this.model[1].projects[index].task.map(x => {
            return {
                uuid: x.uuid,
                state: ExecuteState.NONE
            }
        })
        this.model[1].task_detail = []
        const task = this.model[1].projects[this.model[1].project_index]?.task[this.model[1].task_index]
        const count = task.cronjob ? (task?.jobs.length ?? 0) : 1
        for(let i = 0; i < count; i++){
            this.model[1].task_detail.push({
                index: i,
                node: "",
                message: [],
                state: ExecuteState.NONE
            })
        }
    }
    
    execute_project_finish = (d:Project) => {
        if(this.model[1].process_type >= 1) {
            this.model[1].running = false
            this.model[1].stop = true
        }
        const index = this.model[1].projects.findIndex(x => x.uuid == d.uuid)
        const size = this.model[1].projects.length
        if(index == -1) return
        this.model[1].project = ""
        this.model[1].project_state[index].state = ExecuteState.FINISH
        this.model[1].para = undefined
        console.log("project finish: ", this.model[1].projects.length, index)

        if(index == size - 1){
            this.model[1].command.push(['clean'])
        }
    }
    
    execute_task_start = (d:[Task, number]) => {
        if (this.model[1].project_index == -1) return
        const index = this.model[1].projects[this.model[1].project_index].task.findIndex(x => x.uuid == d[0].uuid)
        if(index == -1) return
        this.model[1].useCron = d[0].cronjob
        this.model[1].task = d[0].uuid
        this.model[1].task_index = index
        this.model[1].task_state[index].state = ExecuteState.RUNNING
        this.model[1].task_detail = []
        const p = this.model[1].projects[this.model[1].project_index]
        const t = p.task[this.model[1].task_index]
        const count = this.model[0].get_task_state_count(t)
        for(let i = 0; i < count; i++){
            this.model[1].task_detail.push({
                index: i,
                node: "",
                message: [],
                state: ExecuteState.NONE
            })
        }
    }

    execute_task_finish = (d:Task) => {
        if(this.model[1].process_type == 2) {
            this.model[1].running = false
            this.model[1].stop = true
        }
        if (this.model[1].project_index == -1) return
        const index = this.model[1].projects[this.model[1].project_index].task.findIndex(x => x.uuid == d.uuid)
        if(index == -1) return
        this.model[1].useCron = false
        this.model[1].task = ""
        this.model[1].task_state[index].state = ExecuteState.FINISH
        if(index + 1 < this.model[1].task_state.length - 1){
            this.model[1].task_state[index + 1].state = ExecuteState.RUNNING
        }
    }
    
    execute_subtask_start = (d:[Task, number, string]) => {
        if(this.model[1].task_detail.length > d[1]){
            this.model[1].task_detail[d[1]].node = d[2]
            this.model[1].task_detail[d[1]].state = ExecuteState.RUNNING
        }else{
            console.error(`subtask_start ${d[1]} is out of range: ${this.model[1].task_detail.length}`)
        }
    }

    execute_subtask_update = (d:[Task, number, string, ExecuteState]) => {
        if(this.model[1].task_detail.length > d[1]){
            this.model[1].task_detail[d[1]].node = d[2]
            this.model[1].task_detail[d[1]].state = d[3]
        }else{
            console.error(`subtask_start ${d[1]} is out of range: ${this.model[1].task_detail.length}`)
        }
    }

    execute_subtask_end = (d:[Task, number, string]) => {
        if(this.model[1].task_detail.length > d[1]){
            //model.value![1].task_detail[d[1]].node = ""
            this.model[1].task_detail[d[1]].state = ExecuteState.FINISH
        }else{
            console.error(`subtask_start ${d[1]} is out of range: ${this.model[1].task_detail.length}`)
        }
    }
    
    execute_job_start = (d:[Job, number, string]) => {
        if (this.model[1].project_index == -1) return
        if(!this.model[1].useCron){
            this.model[1].task_detail[0].node = d[2]
        }
    }
    
    execute_job_finish = (d:[Job, number, string, number]) => {
        if (d[3] == 1){
            const task = this.model[1].projects[this.model[1].project_index].task[this.model[1].task_index]
            const index = task.jobs.findIndex(x => x.uuid == d[0].uuid)
            if(index != -1 && task.jobs[index].category == JobCategory.Condition){
                const cr:ConditionResult = task.jobs[index].number_args[0] as ConditionResult
                if(cr == ConditionResult.None) return
                
                this.model[1].command.push(['stop'])
                let timer:any
                timer = setInterval(() => {
                    if(this.model[1].running == false){
                        clearInterval(timer)
                        const state = (cr == ConditionResult.ThrowTask || cr == ConditionResult.ThrowProject) ? ExecuteState.ERROR : ExecuteState.SKIP
                        const target: ExecuteRecordTask | undefined = this.model[1].task_detail[d[1]]
                        if(target != undefined) {
                            target.state = state
                        }
                        if (cr == ConditionResult.Pause) return
                        if (cr == ConditionResult.SkipProject || cr == ConditionResult.ThrowProject){
                            this.model[1].command.push(['skip', 0, state])
                            if(this.model[1].project.length > 0){
                                if(this.model[1].process_type == 0){
                                    this.model[1].command.push(['execute', this.model[1].process_type])
                                }
                            }
                        }
                        else if (cr == ConditionResult.SkipTask || cr == ConditionResult.ThrowTask){
                            this.model[1].command.push(['skip', 1, state])
                            if(this.model[1].project.length > 0){
                                if(this.model[1].process_type == 0){
                                    this.model[1].command.push(['execute', this.model[1].process_type])
                                }
                            }
                        }
                    }
                }, 1000);
            }
        }
        //model.value![1].task_detail[index].node = ""
    }

    feedback_message = (d:FeedBack) => {
        if(d.index == undefined || d.index == -1) return
        const container = this.model[1].task_detail[d.index]
        if(container != undefined){
            container.message.push(d.message)
            if(container.message.length > MESSAGE_LIMIT){
                container.message.shift()
            }
        }
    }

    /**
     * When parameter getting change by the process steps\
     * This get called
     * @param d The whole container for the parameters
     */
    update_runtime_parameter = (d:Parameter, ) => {
        this.model[1].para = d
    }
}