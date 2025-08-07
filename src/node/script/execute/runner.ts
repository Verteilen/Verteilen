// ========================
//                           
//      Share Codebase     
//                           
// ========================
import { v6 as uuidv6 } from 'uuid';
import { CronJobState, DataType, ExecuteState, Header, Job, Project, Task, WebsocketPack } from "../../interface";
import { ExecuteManager_Feedback } from "./feedback";
import { Util_Parser } from './util_parser';

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
            if(index < this.current_projects.length - 1){
                // * Case A: Next project
                this.messager_log(`[Execute] Project Finish ${this.current_p!.uuid}`)
                this.proxy?.executeProjectFinish([this.current_p!, index])
                this.current_p = this.current_projects[index + 1]
                this.proxy?.executeProjectStart([this.current_p!, index + 1])
                this.t_state = ExecuteState.NONE
            }else{
                // * Case B: Finish entire thing
                this.messager_log(`[Execute] Project Finish ${this.current_p!.uuid}`)
                this.proxy?.executeProjectFinish([this.current_p!, index])
                this.current_p = undefined
                this.state = ExecuteState.FINISH
                this.t_state = ExecuteState.NONE
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
            this.current_multithread = task.multi ? this.get_task_multi_count(task) : 1
            this.current_task_count = this.get_task_state_count(task)
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

        if(task.setupjob){
            allJobFinish = this.ExecuteTask_Setup(project, task, this.current_task_count)
        } else if (task.cronjob){
            allJobFinish = this.ExecuteTask_Cronjob(project, task, this.current_task_count)
        } else {
            allJobFinish = this.ExecuteTask_Single(project, task, this.current_task_count)
        }

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
        let ns:Array<WebsocketPack> = this.get_idle_open()
        let allJobFinish = false

        /**
         * if current_cron length is zero\
         * this means the init process has not been run yet
         */
        if(this.current_cron.length == 0){
            // First time
            this.Init_CronContainer(task, taskCount)
            this.messager_log(`[Execute] TaskCount: ${taskCount}`)
        } else{
            // If disconnect or deleted...
            /**
             * We query all the cron state and get all the processing first and count it\
             * All we want is to filter out the node which is fully load\
             * So we can follow the multithread limit to send the mission
             */
            const worker = this.current_cron.filter(x => x.uuid != '').map(x => x.uuid)
            const counter:Array<[string, number]> = []
            worker.forEach(uuid => {
                const index = counter.findIndex(x => x[0] == uuid)
                if(index == -1) counter.push([uuid, 1])
                else counter[index][1] += 1
            })
            const fullLoadUUID = counter.filter(x => x[1] >= this.current_multithread).map(x => x[0])
            ns = ns.filter(x => !fullLoadUUID.includes(x.uuid))
        }
        
        if(this.check_all_cron_end()){
            allJobFinish = true
        }else{
            // Assign worker
            // Find the cron which is need to be execute by a node
            const needs = this.current_cron.filter(x => x.uuid == '' && x.work.filter(y => y.state != ExecuteState.FINISH && y.state != ExecuteState.ERROR).length > 0)
            const min = Math.min(needs.length, ns.length)
            for(let i = 0; i < min; i++){
                needs[i].uuid = ns[i].uuid
            }
            const single = this.current_cron.filter(x => x.uuid != '')
            // Execute
            for(var cronwork of single){
                const index = this.current_nodes.findIndex(x => x.uuid == cronwork.uuid)
                if(index != -1){
                    this.ExecuteCronTask(project, task, cronwork, this.current_nodes[index])
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
            const last = this.current_nodes.find(x => x.uuid == this.current_job[0].uuid)
            if(last == undefined){
                ns = this.get_idle()
                this.current_job = []
            }else{
                ns = [last]
                if(ns[0].websocket.readyState != 1){
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
                this.proxy?.executeSubtaskStart([task, 0, ns[0].uuid])
            }
        }

        if (ns.length > 0 && ns[0].websocket.readyState == 1 && this.check_socket_state(ns[0]) != ExecuteState.RUNNING)
        {
            if(this.check_single_end()){
                allJobFinish = true
            }else{
                if(this.current_job.length != task.jobs.length){
                    const job:Job = JSON.parse(JSON.stringify(task.jobs[this.current_job.length]))
                    const runtime = uuidv6()
                    this.current_job.push({
                        uuid: ns[0].uuid,
                        runtime: runtime,
                        state: ExecuteState.RUNNING,
                        job: job
                    })
                    job.index = 0
                    job.runtime_uuid = runtime
                    this.ExecuteJob(project, task, job, ns[0], false)
                }
            }
        }
        return allJobFinish
    }

    private ExecuteTask_Setup(project:Project, task:Task, taskCount:number):boolean {
        let ns:Array<WebsocketPack> = this.get_idle_open()
        let allJobFinish = false

        /**
         * if current_cron length is zero\
         * this means the init process has not been run yet
         */
        if(this.current_cron.length == 0){
            // First time
            this.Init_CronContainer(task, taskCount)
            this.messager_log(`[Execute] TaskCount: ${taskCount}`)
            for(let i = 0; i < this.current_cron.length; i++){
                this.current_cron[i].uuid = this.current_nodes[i].uuid
            }
        }
        
        if(this.check_all_cron_end()){
            allJobFinish = true
        }else{
            const single = this.current_cron.filter(x => x.uuid != '')
            // Execute
            for(var cronwork of single){
                const index = this.current_nodes.findIndex(x => x.uuid == cronwork.uuid)
                if(index != -1){
                    this.ExecuteCronTask(project, task, cronwork, this.current_nodes[index])
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
        if(ns.current_job.length < this.current_multithread){
            const rindex = work.work.findIndex(x => x.state == ExecuteState.RUNNING)
            if(rindex != -1) return
            const index = work.work.findIndex(x => x.state == ExecuteState.NONE)
            if(index == 0) this.proxy?.executeSubtaskStart([task, work.id, ns.uuid ])
            if(index == -1) return
            work.work[index].state = ExecuteState.RUNNING
            try {
                const job:Job = JSON.parse(JSON.stringify(task.jobs[index]))
                job.index = work.id
                job.runtime_uuid = work.work[index].runtime
                this.ExecuteJob(project, task, job, ns, true)
            }catch(err){
                this.messager_log(`[ExecuteCronTask Error] UUID: ${task.uuid}, Job count: ${task.jobs.length}, index: ${index}`)
            }
        }
    }

    private ExecuteJob = (project:Project, task:Task, job:Job, wss:WebsocketPack, iscron:boolean) => {
        const n:number = job.index!
        this.messager_log(`[Execute] Job Start ${n}  ${job.uuid}  ${wss.uuid}`)
        this.proxy?.executeJobStart([ job, n, wss.uuid ])
        
        ExecuteManager_Runner.string_args_transform(task, job, this.messager_log, this.localPara!, n)
        const h:Header = {
            name: 'execute_job',
            channel: this.uuid,
            data: job
        }
        wss.current_job.push(job.runtime_uuid!)
        const stringdata = JSON.stringify(h)
        wss.websocket.send(stringdata)
        this.jobstack = this.jobstack + 1
    }

    /**
     * Boradcasting all the parameter and library to all the websocket nodes
     * @param p Target project
     */
    SyncParameter = (p:Project) => {
        // Get the clone para from it
        this.localPara = JSON.parse(JSON.stringify(p.parameter))
        this.messager_log("[Execute] Sync Parameter !")
        this.messager_log("[Execute] Generate local parameter object")
        // Then phrase the expression to value
        for(let i = 0; i < this.localPara!.containers.length; i++){
            if(this.localPara!.containers[i].type == DataType.Expression && this.localPara!.containers[i].meta != undefined){
                const text = `%{${this.localPara!.containers[i].meta}}%`
                const e = new Util_Parser([...Util_Parser.to_keyvalue(this.localPara!)])
                this.localPara!.containers[i].value = e.replacePara(text)
            }
        }
        // Boradcasting
        this.sync_local_para(this.localPara!)
    }


    protected Init_CronContainer = (task:Task, taskCount:number) => {
        this.sync_local_para(this.localPara!)
        this.current_cron = []
        // Create the cronjob instance here
        for(let i = 0; i < taskCount; i++){
            const d:CronJobState = {
                id: i,
                uuid: "",
                work: task.jobs.map(x => ({
                    uuid: x.uuid,
                    runtime: '',
                    state: ExecuteState.NONE,
                    job: x
                }))
            }
            d.work.forEach((x, j) => x.runtime = uuidv6({}, undefined, i * taskCount + j))
            this.current_cron.push(d)
        }
        this.proxy?.executeTaskStart([task, taskCount ])
    }
}