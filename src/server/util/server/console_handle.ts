import { ConditionResult, ExecutePair, ExecuteProxy, ExecuteRecordTask, ExecuteState, FeedBack, Job, JobCategory, MESSAGE_LIMIT, Parameter, Project, Record, Task } from "../../interface"

export class Util_Server_Console { 

    receivedPack = (model:ExecutePair, record:Record) => {
        const pass = model.manager!.Register()
        if(pass == -1){
            model.record!.running = false
            model.record!.stop = true
            return false
        }
        model.record!.projects = record.projects
        model.record!.nodes = record.nodes
        model.record!.project_state = model.record!.projects.map(x => {
            return {
                uuid: x.uuid,
                state: ExecuteState.NONE
            }
        })
        model.record!.project_index = pass
        model.record!.project = record.projects[pass].uuid
        model.record!.task_index = 0
        model.record!.task_state = model.record!.projects[0].task.map(x => {
            return {
                uuid: x.uuid,
                state: ExecuteState.NONE
            }
        })
        model.record!.task_state[0].state = ExecuteState.RUNNING
        model.record!.task_detail = []
        const task = model.record!.projects[model.record!.project_index]?.task[model.record!.task_index]
        const count = task.cronjob ? (task?.jobs.length ?? 0) : 1
        for(let i = 0; i < count; i++){
            model.record!.task_detail.push({
                index: i,
                node: "",
                message: [],
                state: ExecuteState.NONE
            })
        }
        model.manager!.Update()
        return true
    }
}

export class Util_Server_Console_Proxy {
    model:ExecutePair

    constructor(_model:ExecutePair){
        this.model = _model
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

    execute_project_start = (d:[Project, number]) => {
        const index = d[1]
        if(index == -1) return
        this.model.record!.project = d[0].uuid
        this.model.record!.project_index = index
        this.model.record!.project_state[index].state = ExecuteState.RUNNING
        this.model.record!.task_state = this.model.record!.projects[index].task.map(x => {
            return {
                uuid: x.uuid,
                state: ExecuteState.NONE
            }
        })
        this.model.record!.task_detail = []
        const task = this.model.record!.projects[this.model.record!.project_index]?.task[this.model.record!.task_index]
        const count = task.cronjob ? (task?.jobs.length ?? 0) : 1
        for(let i = 0; i < count; i++){
            this.model.record!.task_detail.push({
                index: i,
                node: "",
                message: [],
                state: ExecuteState.NONE
            })
        }
        console.log("project start: ", this.model.record!.projects.length, index)
    }
    
    execute_project_finish = (d:[Project, number]) => {
        if(this.model.record!.process_type >= 1) {
            this.model.record!.running = false
            this.model.record!.stop = true
        }
        const index = d[1]
        const size = this.model.record!.projects.length
        if(index == -1) return
        this.model.record!.project = ""
        this.model.record!.project_state[index].state = ExecuteState.FINISH
        this.model.record!.para = undefined
        console.log("project finish: ", this.model.record!.projects.length, index)

        if(index == size - 1){
            this.model.record!.command.push(['clean'])
        }
    }
    
    execute_task_start = (d:[Task, number]) => {
        if (this.model.record!.project_index == -1) return
        const index = this.model.record!.projects[this.model.record!.project_index].task.findIndex(x => x.uuid == d[0].uuid)
        if(index == -1) return
        this.model.record!.useCron = d[0].cronjob
        this.model.record!.task = d[0].uuid
        this.model.record!.task_index = index
        this.model.record!.task_state[index].state = ExecuteState.RUNNING
        for(let i = 0; i < index; i++) this.model.record!.task_state[i].state =  ExecuteState.FINISH
        for(let i = index + 1; i < this.model.record!.task_state.length; i++) this.model.record!.task_state[i].state =  ExecuteState.NONE
        this.model.record!.task_detail = []
        const p = this.model.record!.projects[this.model.record!.project_index]
        const t = p.task[this.model.record!.task_index]
        const count = this.model.manager!.get_task_state_count(t)
        for(let i = 0; i < count; i++){
            this.model.record!.task_detail.push({
                index: i,
                node: "",
                message: [],
                state: ExecuteState.NONE
            })
        }
    }

    execute_task_finish = (d:Task) => {
        if(this.model.record!.process_type == 2) {
            this.model.record!.running = false
            this.model.record!.stop = true
        }
        if (this.model.record!.project_index == -1) return
        const index = this.model.record!.projects[this.model.record!.project_index].task.findIndex(x => x.uuid == d.uuid)
        if(index == -1) return
        this.model.record!.useCron = false
        this.model.record!.task = ""
        this.model.record!.task_state[index].state = ExecuteState.FINISH
        if(index + 1 < this.model.record!.task_state.length - 1){
            this.model.record!.task_state[index + 1].state = ExecuteState.RUNNING
        }
    }
    
    execute_subtask_start = (d:[Task, number, string]) => {
        try{
            this.model.record!.task_detail[d[1]].node = d[2] ?? ''
            this.model.record!.task_detail[d[1]].state = ExecuteState.RUNNING
        }catch(error:any) {
            console.error(`execute_subtask_start`, error.message)
        }
    }

    execute_subtask_update = (d:[Task, number, string, ExecuteState]) => {
        if(this.model.record!.task_detail.length > d[1]){
            this.model.record!.task_detail[d[1]].node = d[2]
            this.model.record!.task_detail[d[1]].state = d[3]
        }else{
            console.error(`subtask_start ${d[1]} is out of range: ${this.model.record!.task_detail.length}`)
        }
    }

    execute_subtask_end = (d:[Task, number, string]) => {
        try{
            this.model.record!.task_detail[d[1]].state = ExecuteState.FINISH
        }catch(error:any) {
            console.error(`execute_subtask_end`, error.message)
        }
    }
    
    execute_job_start = (d:[Job, number, string]) => {
        if (this.model.record!.project_index == -1) return
        if(!this.model.record!.useCron){
            this.model.record!.task_detail[0].node = d[2]
        }
    }
    
    execute_job_finish = (d:[Job, number, string, number]) => {
        if (d[3] == 1){
            const task = this.model.record!.projects[this.model.record!.project_index].task[this.model.record!.task_index]
            const index = task.jobs.findIndex(x => x.uuid == d[0].uuid)
            if(index != -1 && task.jobs[index].category == JobCategory.Condition){
                const cr:ConditionResult = task.jobs[index].number_args[0] as ConditionResult
                if(cr == ConditionResult.None) return
                
                this.model.record!.command.push(['stop'])
                let timer:any
                timer = setInterval(() => {
                    if(this.model.record!.running == false){
                        clearInterval(timer)
                        const state = (cr == ConditionResult.ThrowTask || cr == ConditionResult.ThrowProject) ? ExecuteState.ERROR : ExecuteState.SKIP
                        const target: ExecuteRecordTask | undefined = this.model.record!.task_detail[d[1]]
                        if(target != undefined) {
                            target.state = state
                        }
                        if (cr == ConditionResult.Pause) return
                        if (cr == ConditionResult.SkipProject || cr == ConditionResult.ThrowProject){
                            this.model.record!.command.push(['skip', 0, state])
                            if(this.model.record!.project.length > 0){
                                if(this.model.record!.process_type == 0){
                                    this.model.record!.command.push(['execute', this.model.record!.process_type])
                                }
                            }
                        }
                        else if (cr == ConditionResult.SkipTask || cr == ConditionResult.ThrowTask){
                            this.model.record!.command.push(['skip', 1, state])
                            if(this.model.record!.project.length > 0){
                                if(this.model.record!.process_type == 0){
                                    this.model.record!.command.push(['execute', this.model.record!.process_type])
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
        const container = this.model.record!.task_detail[d.index]
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
        this.model.record!.para = d
    }
}