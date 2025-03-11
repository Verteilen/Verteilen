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
            this.messager_log(`[Execute] Project Start ${this.current_p.uuid}`)
            this.proxy?.executeProjectStart({ uuid: this.current_p.uuid })
        }
        if (this.current_p != undefined){
            if(this.first) {
                this.first = false
            }
            this.ExecuteProject(this.current_p)
        }
    }

    Stop = () => {
        this.websocket_manager.targets.forEach(x => {
            const h:Header = {
                name: 'stop_job',
                message: 'Stop All Jobs'
            }
            x.websocket.send(JSON.stringify(h))
        })
    }

    SyncParameter = (p:Project) => {
        this.localPara = JSON.parse(JSON.stringify(p.parameter))
        for(let i = 0; i < this.localPara!.containers.length; i++){
            if(this.localPara!.containers[i].type == DataType.Expression && this.localPara!.containers[i].meta != undefined){
                const text = `%{${this.localPara!.containers[i].meta}}%`
                this.localPara!.containers[i].value = this.replacePara(text, [...this.to_keyvalue(this.localPara!)])
            }
        }
        this.websocket_manager.targets.forEach(x => {
            this.sync_para(this.localPara!, x)
        })
    }

    Register = (projects:Array<Project>):number => {
        this.messager_log(`[執行狀態] 開始執行, 專案數: ${projects.length}, 電腦數: ${this.websocket_manager.targets.length}`)
        if(this.state == ExecuteState.RUNNING){
            this.messager_log(`[執行狀態] 初始化錯誤, 目前已經有專案群集在列表中執行了`)
            return -1
        }
        if(projects.map(x => x.task.length).reduce((acc, cur) => acc + cur, 0) == 0){
            this.messager_log(`[執行狀態] 沒有流程可以被執行`)
            return -1
        }
        if(!this.validation(projects)){
            this.messager_log(`[執行狀態] 初始化錯誤, 檢查格式出現問題`)
            return -1
        }
        this.state = ExecuteState.RUNNING
        this.messager_log(`[執行狀態] 初始化成功, 進入執行階段`)

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

    Clean = () => {
        this.current_projects = []
        this.current_p = undefined
        this.current_t = undefined
        this.current_cron = []
        this.current_job = []
        this.current_multithread = 1
        this.state = ExecuteState.NONE
    }

    NewConnection = (source:WebsocketPack) => {
        if(this.state == ExecuteState.RUNNING && this.localPara != undefined){
            this.sync_para(this.localPara, source)
        }
    }

    SkipProject = ():number => {
        if (this.current_projects.length == 0) return -1
        if (this.current_p == undefined) {
            this.current_p = this.current_projects[0]
            this.proxy?.executeProjectStart({ uuid: this.current_p.uuid })
            this.state = ExecuteState.RUNNING
            return 0
        } else {
            const index = this.current_projects.findIndex(x => x.uuid == this.current_p!.uuid)
            if (index == this.current_projects.length - 1){
                this.proxy?.executeProjectFinish({ uuid: this.current_p.uuid })
                this.current_p = undefined
                this.state = ExecuteState.FINISH
                this.messager_log(`[Execute] Skip project Finish !`)
                return -1
            } else {
                this.proxy?.executeProjectFinish({ uuid: this.current_p.uuid })
                this.current_p = this.current_projects[index + 1]
                this.messager_log(`[Execute] Skip project ${index}. ${this.current_p.uuid}`)
                this.proxy?.executeProjectStart({ uuid: this.current_p.uuid })
                return index
            }
        }
    }

    SkipTask = ():number => {
        if (this.current_p == undefined) return -1
        if (this.current_t == undefined){
            if(this.current_p.task.length > 0){
                this.current_t = this.current_p.task[0]
                this.proxy?.executeTaskStart({uuid: this.current_t.uuid, count: this.get_task_count(this.current_p, this.current_t)})
                this.t_state = ExecuteState.RUNNING
            } 
            return 0
        } else {
            const index = this.current_p.task.findIndex(x => x.uuid == this.current_t!.uuid)
            if (index == this.current_p.task.length - 1){
                this.proxy?.executeTaskFinish({ uuid: this.current_t.uuid })
                this.current_t = undefined
                this.messager_log(`[Execute] Skip task Finish !`)
            } else {
                this.proxy?.executeTaskFinish({ uuid: this.current_t.uuid })
                this.current_t = this.current_p.task[index + 1]
                this.messager_log(`[Execute] Skip task ${index}. ${this.current_t.uuid}`)
                this.proxy?.executeTaskStart({uuid: this.current_t.uuid, count: this.get_task_count(this.current_p, this.current_t)})
                this.t_state = ExecuteState.RUNNING
            }
            return index
        }
    }
}