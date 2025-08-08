// ========================
//                           
//      Share Codebase     
//                           
// ========================
import { ExecuteState, Header, Libraries, WebsocketPack } from "../interface";
import { ExecuteManager_Runner } from "./execute/runner";

/**
 * Cluster server calculation worker\
 * The most important worker in the entire application
 */
export class ExecuteManager extends ExecuteManager_Runner {
    /**
     * The update function for let this worker start each iteration
     */
    Update = () => {
        // Only works when state is set to running
        if(this.state != ExecuteState.RUNNING) return
        else if(this.current_p == undefined && this.current_projects.length > 0){
            this.current_p = this.current_projects[0]
            this.messager_log(`[Execute] Project Start ${this.current_p.uuid}`)
            this.proxy?.executeProjectStart([this.current_p, 0])
            this.SyncParameter(this.current_p)
        }
        else if (this.current_p != undefined){
            if(this.first) this.first = false
            this.ExecuteProject(this.current_p)
        }
    }

    /**
     * Pause has been called
     */
    Stop = () => {
        this.current_nodes.forEach(x => {
            const h:Header = {
                name: 'stop_job',
                message: 'Stop All Jobs',
                data: {}
            }
            x.websocket.send(JSON.stringify(h))
        })
        this.jobstack = 0
        this.current_nodes.forEach(x => x.current_job = [])
    }

    /**
     * Register projects to worker\
     * If failed register, the buffer will remind empty
     * @param projects Target
     * @returns -1: register failed, 0: successfully
     */
    Register = (lib?:Libraries):number => {
        this.current_projects = this.record.projects
        this.current_nodes = []
        this.record.nodes.forEach(x => {
            const n = this.websocket_manager.targets.find(y => y.uuid == x.ID)
            if(n != undefined) this.current_nodes.push(n)
        })
        this.messager_log(`[Execute] Start executing, Project count: ${this.current_projects.length}, Node count: ${this.current_nodes.length}`)
        if(this.state == ExecuteState.RUNNING){
            this.messager_log(`[Execute] Init error, There are projects being execute right now`)
            return -1
        }
        if(this.current_nodes.length == 0){
            this.messager_log(`[Execute] Node count should be bigger than one`)
            return -1
        }
        if(this.current_projects.map(x => x.task.length).reduce((acc, cur) => acc + cur, 0) == 0){
            this.messager_log(`[Execute] No task can be executing`)
            return -1
        }
        if(!this.validation(this.current_projects)){
            this.messager_log(`[Execute] Init failed, Format checking error`)
            return -1
        }
        if(lib != undefined) this.libs = this.filter_lib(this.record.projects, lib)
        else this.libs = { libs: [] }

        this.state = ExecuteState.RUNNING
        this.messager_log(`[Execute] Init successfully, Enter process right now, length: ${this.current_projects.length}`)
        
        let i = 0
        for(const x of this.current_projects){
            if(x.task.length > 0){
                break;
            }else{
                i++
            }
        }
        return i
    }

    /**
     * This will reset the state, and emppty all the buffer
     */
    Clean = () => {
        this.current_projects = []
        this.current_p = undefined
        this.current_t = undefined
        this.current_cron = []
        this.current_job = []
        this.current_nodes = []
        this.current_multithread = 1
        this.state = ExecuteState.NONE
    }

    /**
     * Tell clients release lib and parameter data
     */
    Release = () => {
        this.current_nodes.forEach(x => this.release(x))
    }

    /**
     * When new connection (Node) has benn connected
     * @param source Target
     */
    NewConnection = (source:WebsocketPack) => {
        if(this.state == ExecuteState.RUNNING && this.localPara != undefined){
            this.sync_para(this.localPara, source)
        }
    }

    Disconnect = (source:WebsocketPack) => {
        if(this.current_p == undefined) return
        if(this.current_t == undefined) return
        if(this.current_job.length > 0){
            const singleContainIt = this.current_job.filter(x => x.uuid == source.uuid && x.state == ExecuteState.RUNNING)
            singleContainIt.forEach((x, index) => {
                x.uuid = ''
                x.state = ExecuteState.NONE
            })
            this.proxy?.executeSubtaskUpdate([this.current_t!, 0, '', ExecuteState.NONE])
        }else if (this.current_cron.length > 0){
            const cronContainIt = this.current_cron.filter(x => x.work.filter(y => y.state == ExecuteState.RUNNING && y.uuid == source.uuid).length > 0)
            cronContainIt.forEach(element => {
                element.work.forEach(x => {
                    x.uuid = ''
                    x.state = ExecuteState.NONE
                })
                this.proxy?.executeSubtaskUpdate([this.current_t!, element.id - 1, '', ExecuteState.NONE])
            });
        }
        source.current_job = []
    }

    ClearState = (task_index:number) => {
        if(this.current_p == undefined) return
        if(this.current_t == undefined) return
        if(this.current_job.length > 0){
            this.current_job = []
            this.proxy?.executeSubtaskUpdate([this.current_t!, 0, '', ExecuteState.NONE])
        }else if (this.current_cron.length > 0){
            const target = this.current_cron[task_index]
            target.work.forEach(x => {
                x.uuid = ''
                x.state = ExecuteState.NONE
            })
            this.proxy?.executeSubtaskUpdate([this.current_t!, target.id - 1, '', ExecuteState.NONE])
        }
    }

    /**
     * When user trying to skip project
     * @returns The index of the project
     * -1: Skip to finish
     * -2: Skip failed
     */
    SkipProject = ():number => {
        return this.jumpProject(true)
    }

    PreviousProject = ():number => {
        return this.jumpProject(false)
    }

    /**
     * When user trying to skip task
     * @returns The index of the task
     * -1: Skip to finish
     * -2: Skip failed
     */
    SkipTask = ():number => {
        return this.jumpTask(true)
    }

    PreviousTask = ():number => {
        return this.jumpTask(false)
    }

    SkipSubTask = (v:number):number => {
        if (this.current_p == undefined) {
            console.error("No project exist, Skip failed")
            return -2
        }
        if (this.current_t == undefined){
            console.error("Project has no task, Skip failed")
            return -2
        } else {
            if(!this.current_t.cronjob){
                return this.SkipTask()
            }

            const min = Math.min(v, this.current_cron.length)
            for(let i = 0; i < min; i++){
                const ps = this.current_cron[i].work.filter(y => y.state != ExecuteState.FINISH && y.state != ExecuteState.ERROR)
                ps.forEach(x => x.state = ExecuteState.FINISH)
            }
            return min
        }
    }

    private jumpProject = (forward:boolean):number => {
        if (this.current_projects.length == 0) {
            console.error("There is no project exists")
            return -2
        }
        if (this.current_p == undefined) {
            // Not yet start
            return forward ? this.skipProjectFirst() : -2
        } else {
            // When it's in the processing stage
            // Let's find the current processing project, and increments it's index for it
            return this._jumpProject(forward)
        }
    }

    private jumpTask = (forward:boolean):number => {
        // There is no project exists
        if (this.current_p == undefined) return -2
        if (this.current_t == undefined){
            // If we are in the start
            return forward ? this.skipTaskFirst() : this.previousTaskFirst()
        } else {
            // When it's in the processing stage
            // Let's find the current processing task, and increments it's index for it
            return forward ? this.skipTask() : this.previousTask()
        }
    }

    private skipProjectFirst = ():number => {
        this.current_p = this.current_projects[1]
        this.proxy?.executeProjectStart([this.current_p, 1])
        this.SyncParameter(this.current_p)
        this.state = ExecuteState.RUNNING
        return 1
    }

    private _jumpProject = (forward:boolean):number => {
        const index = this.current_projects.findIndex(x => x.uuid == this.current_p!.uuid)
        if(forward) this.proxy?.executeProjectFinish([this.current_p!, index])
        const atend = forward ? index == this.current_projects.length - 1 : index == 0
        if (atend){
            // If it's last project
            if(forward){
                this.current_p = undefined
                this.current_t = undefined
                this.state = ExecuteState.FINISH
                this.messager_log(`[Execute] Skip project to Finish !`)
            }else{
                this.current_p = this.current_projects[0]
                this.current_t = undefined
                this.state = ExecuteState.RUNNING
                this.messager_log(`[Execute] Previous project to Begining !`)
            }
            return -1
        } else {
            const next = forward ? this.current_projects[index + 1] : this.current_projects[index - 1]
            this.current_p = next
            this.current_t = undefined
            this.state = ExecuteState.RUNNING
            if(forward){
                this.messager_log(`[Execute] Skip project ${index}. ${this.current_p.uuid}`)
            }else{
                this.messager_log(`[Execute] Previous project ${index}. ${this.current_p.uuid}`)
            }
            this.proxy?.executeProjectStart([this.current_p, index + (forward ? 1 : -1)])
            this.SyncParameter(this.current_p)
            return index
        }
    }

    private skipTaskFirst = ():number => {
        if(this.current_p!.task.length > 0){
            this.current_t = this.current_p!.task[0]
            const taskCount = this.get_task_state_count(this.current_t)
            if(this.current_t.cronjob){
                this.Init_CronContainer(this.current_t, taskCount)
            }
            this.t_state = ExecuteState.NONE
            this.proxy?.executeTaskStart([this.current_t, taskCount])
            return 0
        }else{
            console.error("Project has no task, Skip failed")
            return -2
        }
    }

    private previousTaskFirst = ():number => {
        const index = this.current_projects.findIndex(x => x.uuid == this.current_p!.uuid)
        if (index == 0){
            // If it's first task and first project
            this.current_t = undefined
        } else {
            this.current_p = this.current_projects[index - 1]
            this.messager_log(`[Execute] Previous task ${index}. Jump Project: ${this.current_p.uuid}`)
        }
        this.current_job = []
        this.t_state = ExecuteState.NONE
        return index
    }

    private skipTask = ():number => {
        const index = this.current_p!.task.findIndex(x => x.uuid == this.current_t!.uuid)
        if (index == this.current_p!.task.length - 1){
            // If it's last task
            this.proxy?.executeTaskFinish(this.current_t!)
            this.current_t = undefined
            this.messager_log(`[Execute] Skip task to Finish !`)
        } else {
            this.proxy?.executeTaskFinish(this.current_t!)
            this.current_t = this.current_p!.task[index + 1]
            this.messager_log(`[Execute] Skip task ${index}. ${this.current_t.uuid}`)
            const taskCount = this.get_task_state_count(this.current_t)
            if(this.current_t.cronjob){
                this.Init_CronContainer(this.current_t, taskCount)
            }
            this.proxy?.executeTaskStart([this.current_t, taskCount])
        }
        this.current_job = []
        this.t_state = ExecuteState.NONE
        return index
    }

    private previousTask = ():number => {
        const index = this.current_p!.task.findIndex(x => x.uuid == this.current_t!.uuid)
        this.current_t = this.current_p!.task[index - 1]
        const taskCount = this.get_task_state_count(this.current_t)
        if(this.current_t.cronjob){
            this.Init_CronContainer(this.current_t, taskCount)
        }
        this.t_state = ExecuteState.NONE
        this.proxy?.executeTaskStart([this.current_t, taskCount])
        return 0
    }
}