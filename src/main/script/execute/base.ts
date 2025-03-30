import { formula, init } from "expressionparser";
import { CronJobState, DataType, ExecuteProxy, ExecuteState, Header, KeyValue, Libraries, Messager, Parameter, Project, Task, WebsocketPack, WorkState } from "../../interface";
import { WebsocketManager } from "../socket_manager";

export class ExecuteManager_Base {
    current_t:Task | undefined = undefined
    current_p:Project | undefined = undefined
    current_projects:Array<Project> = []
    current_cron:Array<CronJobState> = []
    current_job:Array<WorkState> = []
    current_multithread = 1
    current_task_count = -1
    /**
     * * NONE: Not yet start
     * * RUNNING: In the processing stage
     * * FINISH: Everything is finish processing
     */
    state:ExecuteState = ExecuteState.NONE
    t_state:ExecuteState = ExecuteState.NONE 
    jobstack = 0
    first = false
    libs:Libraries | undefined = undefined
    proxy:ExecuteProxy | undefined = undefined
    localPara: Parameter | undefined = undefined

    websocket_manager:WebsocketManager
    messager_log:Messager

    constructor(_websocket_manager:WebsocketManager, _messager_log:Messager) {
        this.websocket_manager = _websocket_manager
        this.messager_log = _messager_log
    }

    protected sync_local_para = (target:Parameter) => {
        this.websocket_manager.targets.forEach(x => this.sync_para(target, x))
        this.proxy?.updateParameter(target)
    }

    //#region Helper
    protected sync_para = (target:Parameter, source:WebsocketPack) => {
        const h:Header = {
            name: 'set_parameter',
            data: target
        }
        const h2:Header = {
            name: 'set_libs',
            data: this.libs
        }
        source.websocket.send(JSON.stringify(h))
        source.websocket.send(JSON.stringify(h2))
    }
    /**
     * Check all the cronjob is finish or not
     */
    protected check_all_cron_end = () => {
        return this.current_cron.filter(x => !this.check_cron_end(x)).length == 0
    }
    /**
     * Check input cronjob is finish or not
     * @param cron target cronjob instance
     */
    protected check_cron_end = (cron:CronJobState) => {
        return cron.work.filter(x => x.state == ExecuteState.RUNNING || x.state == ExecuteState.NONE).length == 0
    }
    /**
     * Check current single is finish or not
     */
    protected check_single_end = () => {
        if(this.current_t == undefined) return false
        return this.current_job.length == this.current_t.jobs.length && 
            this.current_job.filter(y => y.state == ExecuteState.RUNNING || y.state == ExecuteState.NONE).length == 0
    }
    //#endregion


    //#region Utility
    /**
     * Project format checking
     * @param projects 
     * @returns 
     */
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
    /**
     * Get the multi-core setting\
     * Find in the parameter setting
     * @param key The multi-core-key
     * @returns 
     */
    protected get_task_multi_count = (p:Project, t:Task):number => {
        const r = this.get_number(t.multiKey, p)
        return r == -1 ? 1 : r
    }
    /**
     * Get the task's cronjob count
     */
    public get_task_state_count(p:Project, t:Task){
        if (t.cronjob){
            return this.get_number(t.cronjobKey, p)
        }else{
            return 1
        }
    }

    /**
     * Find the number in the parameter, this include the expression phrasing
     * @param key The name key
     * @param p Project instance
     * @returns The value, if key cannot be found, it will return -1
     */
    protected get_number(key:string, p:Project){
        const f = p.parameter.containers.find(x => x.name == key && (x.type == DataType.Number || x.type == DataType.Expression))
        if(f == undefined) return -1
        if(f.type == DataType.Expression){
            return Number(this.replacePara(f.meta ?? '', [...this.to_keyvalue(p.parameter)]))
        }else{
            return f.value
        }
        
    }

    /**
     * Remove dups item in the list
     * @param arr 
     * @returns 
     */
    protected removeDups = (arr: any[]): any[] => {
        return [...new Set(arr)];
    }

    /**
     * Filter out the idle and connection open nodes
     * @returns All idle and open connection nodes
     */
    protected get_idle = ():Array<WebsocketPack> => {
        return this.websocket_manager.targets.filter(x => this.check_socket_state(x) != ExecuteState.RUNNING && x.websocket.readyState == WebSocket.OPEN)
    }
    /**
     * Filter out the connection open nodes
     * @returns All open connection nodes
     */
    protected get_idle_open = ():Array<WebsocketPack> => {
        return this.websocket_manager.targets.filter(x => x.websocket.readyState == WebSocket.OPEN)
    }

    protected check_socket_state = (target:WebsocketPack) => {
        return target.current_job.length == 0 ? ExecuteState.NONE : ExecuteState.RUNNING
    }
    
    /**
     * Replace a string to environment string\
     * * Include Expression calculation
     * * Include Env string, boolean, number replacing
     * @param text Input text
     * @param paras The keyvalue list
     * @returns The result string
     */
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
    /**
     * Turn parameter into a list of keyvalue structure\
     * Exclude the expression datatype
     * @param p Target parameter instance
     * @returns The list of keyvalue
     */
    protected to_keyvalue = (p:Parameter):Array<KeyValue> => {
        const paras = [
            ...p.containers.filter(x => x.type != DataType.Expression).map(x => { return { key: x.name, value: x.value.toString() } })
        ]
        return paras
    }

    private _replacePara = (store:string, paras:Array<KeyValue>) => {
        const index = paras.findIndex(x => x.key == store)
        if(index == -1) return ''
        return paras[index].value
    }

    /**
     * Expression magic
     * @param str Input string, the expression part of string only, not the entire sentence
     * @param paras Keyvalue list
     * @returns Result calculation
     */
    private parse = (str:string, paras:Array<KeyValue>):string => {
        str = str.substring(1, str.length - 1)
        const parser = init(formula, (term: string) => {
            if(term.includes("_ck_")){
                const index = paras.findIndex(x => x.key == "ck")
                if(index != -1) term = this.replaceAll(term, "_ck_", paras[index].value)
            }
            const index = paras.findIndex(x => x.key == term)
            if(index != -1) return Number(paras[index].value)
            else return 0
        });
        const r = parser.expressionToValue(str).toString()
        return r
    }

    protected replaceAll = (str:string, fi:string, tar:string):string => {
        let p = str
        while(p.includes(fi)) p = p.replace(fi, tar)
        return p
    }
    //#endregion
}