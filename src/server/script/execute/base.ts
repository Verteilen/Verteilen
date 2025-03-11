import { formula, init } from "expressionparser";
import { CronJobState, DataType, ExecuteProxy, ExecuteState, Header, KeyValue, Libraries, Parameter, Project, Task, WebsocketPack, WorkState } from "../../interface";
import { WebsocketManager } from "../socket_manager";

export class ExecuteManager_Base {
    current_t:Task | undefined = undefined
    current_p:Project | undefined = undefined
    current_projects:Array<Project> = []
    current_cron:Array<CronJobState> = []
    current_job:Array<WorkState> = []
    current_multithread = 1
    state:ExecuteState = ExecuteState.NONE
    t_state:ExecuteState = ExecuteState.NONE 
    jobstack = 0
    first = false
    libs:Libraries | undefined = undefined
    proxy:ExecuteProxy | undefined = undefined
    localPara: Parameter | undefined = undefined

    websocket_manager:WebsocketManager
    messager_log:Function

    constructor(_websocket_manager:WebsocketManager, _messager_log:Function) {
        this.websocket_manager = _websocket_manager
        this.messager_log = _messager_log
    }

    //#region Helper
    protected sync_para = (target:Parameter, source:WebsocketPack) => {
        const h:Header = {
            name: 'set_parameter',
            message: 'Initialization Parameter',
            data: target
        }
        const h2:Header = {
            name: 'set_libs',
            message: 'Initialization Libs',
            data: this.libs
        }
        source.websocket.send(JSON.stringify(h))
        source.websocket.send(JSON.stringify(h2))
    }
    protected check_all_cron_end = () => {
        return this.current_cron.filter(x => !this.check_cron_end(x)).length == 0
    }
    protected check_cron_end = (cron:CronJobState) => {
        return cron.work.filter(x => x.state != ExecuteState.FINISH && x.state != ExecuteState.ERROR).length == 0
    }
    protected check_single_end = () => {
        if(this.current_t == undefined) return false
        return this.current_job.length == this.current_t.jobs.length && this.current_job.filter(y => y.state != ExecuteState.FINISH && y.state != ExecuteState.ERROR).length == 0
    }
    protected get_task_count = (p:Project, t:Task) => {
        if(t.cronjob){
            const count = p.parameter.containers.find(x => x.name == t.cronjobKey && x.type == DataType.Number)?.value ?? -1
            return count
        }
        return 1
    }
    //#endregion


    //#region Utility
    public get_task_state_count(p:Project, t:Task){
        if (t.cronjob){
            return this.get_number(t.cronjobKey, p)
        }else{
            return 1
        }
    }

    protected get_number(key:string, p:Project){
        const f = p.parameter.containers.find(x => x.name == key && (x.type == DataType.Number || x.type == DataType.Expression))
        if(f == undefined) return -1
        if(f.type == DataType.Expression){
            return Number(this.replacePara(f.meta ?? '', [...this.to_keyvalue(p.parameter)]))
        }else{
            return f.value
        }
        
    }

    protected removeDups = (arr: any[]): any[] => {
        return [...new Set(arr)];
    }

    protected parse = (str:string, paras:Array<KeyValue>):string => {
        str = str.substring(1, str.length - 1)
        const parser = init(formula, (term: string) => {
            const index = paras.findIndex(x => x.key == term)
            if(index != -1) return Number(paras[index].value)
            else return 0
        });
        const r = parser.expressionToValue(str).toString()
        console.log(str, r)
        return r
    }
    
    protected get_idle = ():Array<WebsocketPack> => {
        const all = this.websocket_manager.targets.filter(x => x.state != ExecuteState.RUNNING && x.websocket.readyState == WebSocket.OPEN)
        if(all.length != 0){
            return all
        }else return []
    }
    
    protected set_multi = (key:string):number => {
        if(this.current_p == undefined) return 1
        const index = this.current_p.parameter.containers.findIndex(x => x.name == key && x.type == DataType.Number)
        return this.current_p.parameter.containers[index].value
    }
    
    protected validation = (projects:Array<Project>):boolean => {
        if (this.websocket_manager.targets.length == 0) {
            this.messager_log(`[Execute State] The execute node does not exists`)
            return false
        }
        projects.forEach(x => {
            x.task.forEach(t => {
                if(t.cronjob){
                    const index = x.parameter.containers.findIndex(x => x.name == t.cronjobKey && x.type == DataType.Number)
                    if(index == -1){
                        this.messager_log(`[Execute:CronJob] Project ${x.title} (${x.uuid}), Task ${t.title} (${t.uuid}), Has unknoed parameter: \"${t.cronjobKey}\"`)
                        this.messager_log(`[Execute:CronJob] Cron task registerd key not found`)
                        return false
                    }
                    else if (x.parameter.containers[index].value == 0){
                        this.messager_log(`[Execute:CronJob] Project ${x.title} (${x.uuid}), Task ${t.title} (${t.uuid}), Has unknoed parameter: \"${t.cronjobKey}\"`)
                        this.messager_log(`[Execute:CronJob] Cron task value must bigger than 0`)
                        return false
                    }
                }
                if(t.cronjob && t.multi){
                    const index = x.parameter.containers.findIndex(x => x.name == t.multiKey && x.type == DataType.Number)
                    if(index == -1){
                        this.messager_log(`[Execute:Multi] Project ${x.title} (${x.uuid}), Task ${t.title} (${t.uuid}), Has unknoed parameter: \"${t.multiKey}\"`)
                        this.messager_log(`[Execute:Multi] Cron task registerd key not found`)
                        return false
                    }
                    else if (x.parameter.containers[index].value == 0){
                        this.messager_log(`[Execute:Multi] Project ${x.title} (${x.uuid}), Task ${t.title} (${t.uuid}), Has unknoed parameter: \"${t.multiKey}\"`)
                        this.messager_log(`[Execute:Multi] Cron task value must bigger than 0`)
                        return false
                    }
                }
            })
        })
        return true
    }
    
    protected _replacePara = (store:string, paras:Array<KeyValue>) => {
        const index = paras.findIndex(x => x.key == store)
        if(index == -1) return ''
        return paras[index].value
    }
    
    protected replacePara = (text:string, paras:Array<KeyValue>):string => {
        if (this.current_p == undefined) return text
        let buffer = ''
        let store = ''
        let state:boolean = false
        let useExp = false
        for(const v of text){
            if(v == '%'){
                state = !state
                if(!state) { // End
                    if(useExp){
                        buffer += this.parse(store, paras)
                    }else{
                        buffer += this._replacePara(store, paras)
                    }
                    store = ""
                    useExp = false
                }
            }
            if(v == '{' && state && store.length == 0) useExp = true
            if(state && v != '%') store += v
            if(!state && v != '%') buffer += v
        }
        return buffer
    }

    protected to_keyvalue = (p:Parameter):Array<KeyValue> => {
        const paras = [
            ...p.containers.filter(x => x.type != DataType.Expression).map(x => { return { key: x.name, value: x.value.toString() } })
        ]
        return paras
    }
    //#endregion
}