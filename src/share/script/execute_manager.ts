import { DataType, ExecuteState, Header, Project, WebsocketPack } from "../interface";
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
        if(this.state != ExecuteState.RUNNING) return
        if(this.current_p == undefined && this.current_projects.length > 0){
            this.current_p = this.current_projects[0]
            this.SyncParameter(this.current_p)
            this.messager_log(`[Execute] Project Start ${this.current_p.uuid}`)
            this.proxy?.executeProjectStart(this.current_p)
        }
        if (this.current_p != undefined){
            if(this.first) {
                this.first = false
            }
            this.ExecuteProject(this.current_p)
        }
    }

    /**
     * Pause has been called
     */
    Stop = () => {
        this.websocket_manager.targets.forEach(x => {
            const h:Header = {
                name: 'stop_job',
                message: 'Stop All Jobs'
            }
            x.websocket.send(JSON.stringify(h))
        })
        this.jobstack = 0
        this.websocket_manager.targets.forEach(x => x.state = ExecuteState.NONE)
    }

    /**
     * Register projects to worker\
     * If failed register, the buffer will remind empty
     * @param projects Target
     * @returns -1: register failed, 0: successfully
     */
    Register = (projects:Array<Project>):number => {
        this.messager_log(`[Execute] Start executing, Project count: ${projects.length}, Node count: ${this.websocket_manager.targets.length}`)
        if(this.state == ExecuteState.RUNNING){
            this.messager_log(`[Execute] Init error, There are projects being execute right now`)
            return -1
        }
        if(projects.map(x => x.task.length).reduce((acc, cur) => acc + cur, 0) == 0){
            this.messager_log(`[Execute] No task can be executing`)
            return -1
        }
        if(!this.validation(projects)){
            this.messager_log(`[Execute] Init failed, Format checking error`)
            return -1
        }
        this.state = ExecuteState.RUNNING
        this.messager_log(`[Execute] Init successfully, Enter process right now`)

        this.current_projects = projects
        let i = 0
        for(const x of this.current_projects){
            if(x.task.length > 0){
                this.current_p = x;
                this.current_t = this.current_p.task[0]
                break;
            }else{
                i++
            }
        }
        return i
    }

    /**
     * Boradcasting all the parameter and library to all the websocket nodes
     * @param p Target project
     */
    SyncParameter = (p:Project) => {
        // Get the clone para from it
        this.localPara = JSON.parse(JSON.stringify(p.parameter))
        // Then phrase the expression to value
        for(let i = 0; i < this.localPara!.containers.length; i++){
            if(this.localPara!.containers[i].type == DataType.Expression && this.localPara!.containers[i].meta != undefined){
                const text = `%{${this.localPara!.containers[i].meta}}%`
                this.localPara!.containers[i].value = this.replacePara(text, [...this.to_keyvalue(this.localPara!)])
            }
        }
        // Boradcasting
        this.sync_local_para(this.localPara!)
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
        this.current_multithread = 1
        this.state = ExecuteState.NONE
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

    /**
     * When user trying to skip project
     * @returns The index of the project
     * -1: Skip to finish
     * -2: Skip failed
     */
    SkipProject = ():number => {
        // There is no project exists
        if (this.current_projects.length == 0) return -2
        // Not yet start
        if (this.current_p == undefined) {
            this.current_p = this.current_projects[0]
            this.proxy?.executeProjectStart(this.current_p)
            this.state = ExecuteState.RUNNING
            return 0
        } else {
            // When it's in the processing stage
            // Let's find the current processing project, and increments it's index for it
            const index = this.current_projects.findIndex(x => x.uuid == this.current_p!.uuid)
            this.proxy?.executeProjectFinish(this.current_p)
            if (index == this.current_projects.length - 1){
                // If it's last project
                this.current_p = undefined
                this.current_t = undefined
                this.state = ExecuteState.FINISH
                this.messager_log(`[Execute] Skip project to Finish !`)
                return -1
            } else {
                this.current_p = this.current_projects[index + 1]
                this.current_t = undefined
                this.state = ExecuteState.RUNNING
                this.messager_log(`[Execute] Skip project ${index}. ${this.current_p.uuid}`)
                this.proxy?.executeProjectStart(this.current_p)
                return index
            }
        }
    }

    /**
     * When user trying to skip task
     * @returns The index of the task
     * -1: Skip to finish
     * -2: Skip failed
     */
    SkipTask = ():number => {
        // There is no project exists
        if (this.current_p == undefined) return -2
        if (this.current_t == undefined){
            // If we are in the start
            if(this.current_p.task.length > 0){
                this.current_t = this.current_p.task[0]
                this.proxy?.executeTaskStart([this.current_t, this.get_task_state_count(this.current_p, this.current_t)])
                this.t_state = ExecuteState.NONE
                return 0
            }else{
                console.error("Project has no task, Skip failed")
                return -2
            }
        } else {
            // When it's in the processing stage
            // Let's find the current processing task, and increments it's index for it
            const index = this.current_p.task.findIndex(x => x.uuid == this.current_t!.uuid)
            if (index == this.current_p.task.length - 1){
                // If it's last task
                this.proxy?.executeTaskFinish(this.current_t)
                this.current_t = undefined
                this.messager_log(`[Execute] Skip task to Finish !`)
            } else {
                this.proxy?.executeTaskFinish(this.current_t)
                this.current_t = this.current_p.task[index + 1]
                this.messager_log(`[Execute] Skip task ${index}. ${this.current_t.uuid}`)
                this.proxy?.executeTaskStart([this.current_t, this.get_task_state_count(this.current_p, this.current_t)])
            }
            this.current_cron = []
            this.current_job = []
            this.t_state = ExecuteState.NONE
            return index
        }
    }
}