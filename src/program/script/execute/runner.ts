import { CronJobState, ExecuteState, Header, Job, Parameter, Project, Task, WebsocketPack, WorkState } from "../../interface";
import { ExecuteManager_Feedback } from "./feedback";

/**
 * The execute runner
 */
export class ExecuteManager_Runner extends ExecuteManager_Feedback {
    /**
     * Execute project
     */
    protected ExecuteProject = (project:Project) => {
        if(this.current_t == undefined && project.task.length > 0 && this.t_state != ExecuteState.FINISH){
            // When we are just start it, the project run
            this.current_t = project.task[0]
            this.messager_log(`[Execute] Task Start ${this.current_t.uuid}`)
            this.messager_log(`[Execute] Task cron state: ${this.current_t.cronjob}`)
            this.current_job = []
            this.current_cron = []
        } else if (project.task.length == 0){
            this.current_t = undefined
        }

        /**
         * In any case, if the task has value, this mean we are in the task stage, so, just ignore everything.\
         * Go for the task stage
         */
        if(this.current_t != undefined){
            this.ExecuteTask(project, this.current_t)
        }else{
            /**
             * If we are here, task is none by this case. This can only be 
             * * A: We are finish all the tasks, And there is no next project, So just mark as finish for entire process
             * * B: We are finish all the tasks, Go to next project
             */
            const index = this.current_projects.findIndex(x => x.uuid == project.uuid)
            if(index == this.current_projects.length - 1){
                // * Case A: Finish entire thing
                this.messager_log(`[Execute] Project Finish ${this.current_p!.uuid}`)
                this.proxy?.executeProjectFinish(this.current_p!)
                this.current_p = undefined
                this.state = ExecuteState.FINISH
                this.t_state = ExecuteState.NONE
            }else{
                // * Case B: Next project
                this.current_p = this.current_projects[index + 1]
            }
        }
    }

    /**
     * Execute task
     */
    private ExecuteTask = (project:Project, task:Task) => {
        /**
         * When it's the first iteration for this task
         */
        if(this.t_state == ExecuteState.NONE){
            this.t_state = ExecuteState.RUNNING
            this.current_multithread = task.multi ? this.get_task_multi_count(project, task) : 1
            this.current_task_count = this.get_task_state_count(project, task)
        }
        let allJobFinish = false
        const hasJob = task.jobs.length > 0

        /**
         * If a task has no job... we have to skip it...
         */
        if(!hasJob){
            // We end it gracefully.
            this.proxy?.executeTaskStart([task, this.current_task_count ])
            this.proxy?.executeTaskFinish(task)
            this.messager_log(`[Execute] Skip ! No job exists ${task.uuid}`)
            this.ExecuteTask_AllFinish(project, task)
            return
        }

        allJobFinish = task.cronjob ? this.ExecuteTask_Cronjob(project, task, this.current_task_count) : this.ExecuteTask_Single(project, task, this.current_task_count)

        if (allJobFinish){
            this.ExecuteTask_AllFinish(project, task)
        }
    }

    /**
     * It will spawn amounts of cronjob and send the tasks for assigned node to execute them one by one
     * @param taskCount Should be equal to cronjob result
     * @returns Is finish executing
     */
    private ExecuteTask_Cronjob(project:Project, task:Task, taskCount:number):boolean {
        let ns:Array<WebsocketPack> = this.get_idle()
        let allJobFinish = false

        /**
         * if current_cron length is zero\
         * this means the init process has not been run yet
         */
        if(this.current_cron.length == 0){
            // First time
            this.sync_local_para(this.localPara!)
            // Create the cronjob instance here
            for(let index = 1; index < taskCount + 1; index++){
                const d:CronJobState = {
                    id: index,
                    uuid: "",
                    work: task.jobs.map(x => {
                        return {
                            uuid: x.uuid,
                            state: ExecuteState.NONE,
                            job: x
                        }
                    })
                }
                this.current_cron.push(d)
            }
            this.proxy?.executeTaskStart([task, taskCount ])
        } else{
            // If disconnect or deleted...
            const worker = this.current_cron.filter(x => x.uuid != '').map(x => x.uuid)
            ns = ns.filter(x => !worker.includes(x.uuid))
        }
        
        const allworks:Array<WorkState> = []
        this.current_cron.forEach(x => {
            allworks.push(...x.work)
        })
        
        if(this.check_all_cron_end()){
            allJobFinish = true
        }else{
            // Assign worker
            const needs = this.current_cron.filter(x => x.uuid == '' && x.work.filter(y => y.state != ExecuteState.FINISH && y.state != ExecuteState.ERROR).length > 0)
            const min = Math.min(needs.length, ns.length)
            for(let i = 0; i < min; i++){
                needs[i].uuid = ns[i].uuid
            }

            // Execute
            const single = this.current_cron.filter(x => x.uuid != '')
            for(var cronwork of single){
                const index = this.websocket_manager.targets.findIndex(x => x.uuid == cronwork.uuid)
                if(index != -1){
                    this.ExecuteCronTask(project, task, cronwork, this.websocket_manager.targets[index])
                }
            }
        }
        return allJobFinish
    }

    /**
     * There will be no CronTask be called, it will go straight to the Execute job section
     * @param taskCount Must be 1
     * @returns Is finish executing
     */
    private ExecuteTask_Single(project:Project, task:Task, taskCount:number):boolean {
        let allJobFinish = false
        let ns:Array<WebsocketPack> = []
        if(this.current_job.length > 0){
            // If disconnect or deleted...
            const last = this.websocket_manager.targets.find(x => x.uuid == this.current_job[0].uuid)
            if(last == undefined){
                ns = this.get_idle()
                this.current_job = []
            }else{
                ns = [last]
                if(ns[0].websocket.readyState != WebSocket.OPEN){
                    ns = this.get_idle()
                    this.current_job = []
                }
            }
        }else{
            // First time
            this.sync_local_para(this.localPara!)
            ns = this.get_idle()
            if(ns.length > 0) {
                this.proxy?.executeTaskStart([task, taskCount ])
                this.proxy?.executeSubtaskFinish([task, 0, ns[0].uuid])
            }
        }

        if (ns.length > 0 && ns[0].websocket.readyState == WebSocket.OPEN && ns[0].state != ExecuteState.RUNNING)
        {
            if(this.check_single_end()){
                allJobFinish = true
            }else{
                if(this.current_job.length != task.jobs.length){
                    const job:Job = JSON.parse(JSON.stringify(task.jobs[this.current_job.length]))
                    this.current_job.push({
                        uuid: ns[0].uuid,
                        state: ExecuteState.RUNNING,
                        job: job
                    })
                    job.index = 1
                    this.ExecuteJob(project, task, job, ns[0], false)
                }
            }
        }
        return allJobFinish
    }

    private ExecuteTask_AllFinish(project:Project, task:Task){
        this.proxy?.executeTaskFinish(task)
        this.messager_log(`[Execute] Task Finish ${task.uuid}`)
        const index = project.task.findIndex(x => x.uuid == task.uuid)
        if(index == project.task.length - 1){
            // Finish
            this.current_t = undefined
            this.t_state = ExecuteState.FINISH
        }else{
            // Next
            this.current_t = project.task[index + 1]
            this.t_state = ExecuteState.NONE
        }
        this.current_job = []
        this.current_cron = []
    }

    private ExecuteCronTask = (project:Project, task:Task, work:CronJobState, ns:WebsocketPack) => {
        if(ns.state != ExecuteState.RUNNING && ns.current_job == undefined){
            const index = work.work.findIndex(x => x.state == ExecuteState.NONE)
            if(index == 0){
                this.proxy?.executeSubtaskStart([task, work.id - 1, ns.uuid ])
            }
            if(index == -1) return
            work.work[index].state = ExecuteState.RUNNING
            const job:Job = JSON.parse(JSON.stringify(task.jobs[index]))
            job.index = work.id
            this.ExecuteJob(project, task, job, ns, true)
        }
    }

    private ExecuteJob = (project:Project, task:Task, job:Job, wss:WebsocketPack, iscron:boolean) => {
        const n:number = job.index!
        this.messager_log(`[Execute] Job Start ${n}  ${job.uuid}  ${wss.uuid}`)
        this.proxy?.executeJobStart([ job, n - 1, wss.uuid ])
        let parameter_job:Parameter = JSON.parse(JSON.stringify(this.localPara))

        for(let i = 0; i < job.string_args.length; i++){
            const b = job.string_args[i]
            if(b == null || b == undefined || b.length == 0) continue
            for(let j = 0; j < task.properties.length; j++){
                job.string_args[i] = this.replaceAll(job.string_args[i], `%${task.properties[j].name}%`, `%{${task.properties[j].expression}}%`)
            }
            job.string_args[i] = this.replacePara(job.string_args[i], [...this.to_keyvalue(parameter_job), { key: 'ck', value: n.toString() }])
            this.messager_log(`String replace: ${b} ${job.string_args[i]}`)
        }
        const h:Header = {
            name: 'execute_job',
            data: job
        }
        wss.current_job = job.uuid
        wss.state = ExecuteState.RUNNING
        const stringdata = JSON.stringify(h)
        wss.websocket.send(stringdata)
        this.jobstack = this.jobstack + 1
    }
}