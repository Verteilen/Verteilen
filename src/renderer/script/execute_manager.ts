import { formula, init } from "expressionparser";
import { BusAnalysis, CronJobState, ExecuteProxy, ExecuteState, FeedBack, Header, Job, KeyValue, Libraries, Parameter, Project, Setter, Single, SystemLoad, Task, WebsocketPack, WorkState } from "../interface";
import { WebsocketManager } from "./socket_manager";

export class ExecuteManager{
    current_t:Task | undefined = undefined
    current_p:Project | undefined = undefined
    current_projects:Array<Project> = []
    current_cron:Array<CronJobState> = []
    current_job:Array<WorkState> = []
    current_multithread = 1
    state:ExecuteState = ExecuteState.NONE
    t_state:ExecuteState = ExecuteState.NONE 
    websocket_manager:WebsocketManager
    jobstack = 0
    first = false
    libs:Libraries | undefined = undefined
    proxy:ExecuteProxy | undefined = undefined
    messager_log:Function
    localPara: Parameter | undefined = undefined

    constructor(_websocket_manager:WebsocketManager, _messager_log:Function) {
        this.websocket_manager = _websocket_manager
        this.messager_log = _messager_log
    }

    Analysis = (d:BusAnalysis) => {
        const typeMap:{ [key:string]:Function } = {
            'feedback_message': this.feedback_message,
            'feedback_job': this.feedback_job,
            'feedback_string': this.feedback_string,
            'feedback_boolean': this.feedback_boolean,
            'feedback_number': this.feedback_number,
            'system_info': this.system_info,
            'pong': this.pong,
        }
        if(typeMap.hasOwnProperty(d.name)){
            const castingFunc = typeMap[d.h.name]
            castingFunc(d.h.data, d.c)
        }else{
            this.messager_log(`[Source Data Analysis] Decode failed, Unknowed header, name: ${d.name}, meta: ${d.h.meta}`)
        }
    }

    private ExecuteJob = (project:Project, task:Task, job:Job, wss:WebsocketPack, iscron:boolean) => {
        const n:number = job.index!
        this.messager_log(`[Execute] Job Start ${n}  ${job.uuid}  ${wss.uuid}`)
        this.proxy?.executeJobStart({ uuid: job.uuid, index: n - 1, node: wss.uuid })

        for(let i = 0; i < job.string_args.length; i++){
            const b = job.string_args[i]
            if(b == null || b == undefined || b.length == 0) continue
            for(let j = 0; j < task.properties.length; j++){
                job.string_args[i] = job.string_args[i].replace(`%${task.properties[j].name}%`, `%{${task.properties[j].expression}}%`)
            }
            job.string_args[i] = this.replacePara(job.string_args[i], [...this.to_keyvalue(this.localPara!), { key: 'ck', value: n.toString() }])
            console.log("String replace: ", b, job.string_args[i])
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
    
    private ExecuteCronTask = (project:Project, task:Task, work:CronJobState, ns:WebsocketPack) => {
        if(ns.state != ExecuteState.RUNNING && ns.current_job == undefined){
            const index = work.work.findIndex(x => x.state == ExecuteState.NONE)
            if(index == 0){
                this.proxy?.executeSubtaskStart({ index:work.id - 1, node: ns.uuid })
            }
            if(index == -1) return
            work.work[index].state = ExecuteState.RUNNING
            const job:Job = JSON.parse(JSON.stringify(task.jobs[index]))
            job.index = work.id
            this.ExecuteJob(project, task, job, ns, true)
        }
    }
    
    private ExecuteTask = (project:Project, task:Task) => {
        this.current_multithread = task.multi ? this.set_multi(task.multiKey) : 1
        let ns:Array<WebsocketPack> = []
        let allJobFinish = false
        let hasJob = task.jobs.length > 0
        const taskCount = this.get_task_count(project, task)

        if(!hasJob){
            this.proxy?.executeTaskStart({ uuid: task.uuid, count: taskCount })
            this.proxy?.executeTaskFinish({ uuid: task.uuid })
            console.log(`[Execute] Skip ! No job exists ${task.uuid}`)
            allJobFinish = true
        }else{
            if(task.cronjob){
                if(this.current_cron.length > 0){
                    // If disconnect or deleted...
                    const worker = this.current_cron.filter(x => x.uuid != '').map(x => x.uuid)
                    ns = this.get_idle()
                    ns = ns.filter(x => !worker.includes(x.uuid))
                }else{
                    // First time
                    this.SyncParameter(project)
                    ns = this.get_idle()
                    for(let index = 1; index < taskCount + 1; index++){
                        const d:CronJobState = {
                            id: index,
                            uuid: "",
                            work: task.jobs.map(x => {
                                return {
                                    uuid: x.uuid,
                                    state: ExecuteState.NONE
                                }
                            })
                        }
                        this.current_cron.push(d)
                    }
                    this.proxy?.executeTaskStart({ uuid: task.uuid, count: taskCount })
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
                
            }else{
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
                    this.SyncParameter(project)
                    ns = this.get_idle()
                    if(ns.length > 0) {
                        this.proxy?.executeTaskStart({ uuid: task.uuid, count: taskCount })
                        this.proxy?.executeSubtaskFinish({ index: 0, node: ns[0].uuid })
                    }
                }

                if (ns.length > 0 && ns[0].websocket.readyState == WebSocket.OPEN && ns[0].state != ExecuteState.RUNNING)
                {
                    if(this.check_single_end()){
                        allJobFinish = true
                    }else{
                        if(this.current_job.length != task.jobs.length){
                            this.current_job.push({
                                uuid: ns[0].uuid,
                                state: ExecuteState.RUNNING
                            })
                            const job:Job = JSON.parse(JSON.stringify(task.jobs[this.current_job.length - 1]))
                            job.index = 1
                            this.ExecuteJob(project, task, job, ns[0], false)
                        }
                    }
                }
                else return
            }
        }

        if (allJobFinish){
            this.proxy?.executeTaskFinish({ uuid: task.uuid })
            this.messager_log(`[Execute] Task Finish ${task.uuid}`)
            const index = project.task.findIndex(x => x.uuid == task.uuid)
            if(index == project.task.length - 1){
                // Finish
                this.current_t = undefined
                this.t_state = ExecuteState.FINISH
            }else{
                // Next
                this.current_t = project.task[index + 1]
            }
            this.current_job = []
            this.current_cron = []
        }
    }

    private ExecuteProject = (project:Project) => {
        if(this.current_t == undefined && project.task.length > 0 && this.t_state != ExecuteState.FINISH){
            this.current_t = project.task[0]
            this.t_state = ExecuteState.RUNNING
            this.messager_log(`[Execute] Task Start ${this.current_t.uuid}`)
            this.messager_log(`[Execute] Task cron state: ${this.current_t.cronjob}`)
            this.current_job = []
            this.current_cron = []
        } else if (project.task.length == 0){
            this.current_t = undefined
        }

        if(this.current_t != undefined){
            this.ExecuteTask(this.current_p!, this.current_t)
        }else{
            const index = this.current_projects.findIndex(x => x.uuid == project.uuid)
            if(index == this.current_projects.length - 1){
                // Finish
                this.messager_log(`[Execute] Project Finish ${this.current_p?.uuid}`)
                this.proxy?.executeProjectFinish({ uuid: this.current_p?.uuid ?? '' } )
                this.current_p = undefined
                this.state = ExecuteState.FINISH
                this.t_state = ExecuteState.NONE
            }else{
                // Next
                this.current_p = this.current_projects[index + 1]
            }
        }
    }

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

    //#region Feedback
    private feedback_message = (data:Single, source:WebsocketPack | undefined) => {
        if(source == undefined) return
        if(this.state == ExecuteState.NONE) return
        this.messager_log(`[Execute] Single Received data: ${data.data}`)
        const d:Setter = { key: source.uuid, value: data.data}
        this.proxy?.feedbackMessage(d)
    }
    
    private feedback_job = (data:FeedBack, source:WebsocketPack | undefined) => {
        if(source == undefined) return
        if(this.state == ExecuteState.NONE) return
        
        this.jobstack = this.jobstack - 1
        this.messager_log(`[Execute] Job Feedback: ${data.job_uuid} ${data.message}`)
        if(this.current_job.length > 0){
            this.proxy?.executeJobFinish({uuid: data.job_uuid, index: 0, node: source.uuid, meta: data.meta})
            this.current_job[this.current_job.length - 1].state = data.meta == 0 ? ExecuteState.FINISH : ExecuteState.ERROR
            if(this.check_single_end()){
                this.proxy?.executeSubtaskFinish({index: 0, node: source.uuid})
            }
        }
        else if(this.current_cron.length > 0){
            const index = this.current_cron.findIndex(x => x.uuid == source.uuid)
            const jindex = this.current_cron[index].work.findIndex(x => x.uuid == data.job_uuid)
            this.proxy?.executeJobFinish({uuid: data.job_uuid, index: this.current_cron[index].id - 1, node: source.uuid, meta: data.meta})
            this.current_cron[index].work[jindex].state = data.meta == 0 ? ExecuteState.FINISH : ExecuteState.ERROR
            if(this.check_cron_end(this.current_cron[index])){
                this.proxy?.executeSubtaskFinish({ index: this.current_cron[index].id - 1, node: this.current_cron[index].uuid })
                this.current_cron[index].uuid = ''
            }
        }
        source.state = ExecuteState.NONE
        source.current_job = undefined
        const d:Setter = { key: data.job_uuid, value: data.message}
        this.proxy?.feedbackMessage(d)
    }
    
    private feedback_string = (data:Setter) => {
        if(this.current_p == undefined) return
        const index = this.current_p.parameter.strings.findIndex(x => x.name == data.key)
        if(index != -1) this.current_p.parameter.strings[index].value = data.value
        this.messager_log(`[String Feedback] ${data.key} = ${data.value}`)
        // Sync
        const d:Header = { name: 'set_string', data: data}
        this.websocket_manager.targets.forEach(x => x.websocket.send(JSON.stringify(d)))
    }
    
    private feedback_number = (data:Setter) => {
        if(this.current_p == undefined) return
        const index = this.current_p.parameter.numbers.findIndex(x => x.name == data.key)
        if(index != -1) this.current_p.parameter.numbers[index].value = data.value
        this.messager_log(`[Number Feedback] ${data.key} = ${data.value}`)
        // Sync
        const d:Header = { name: 'set_number', data: data}
        this.websocket_manager.targets.forEach(x => x.websocket.send(JSON.stringify(d)))
    }
    
    private feedback_boolean = (data:Setter) => {
        if(this.current_p == undefined) return
        const index = this.current_p.parameter.booleans.findIndex(x => x.name == data.key)
        if(index != -1) this.current_p.parameter.booleans[index].value = data.value
        this.messager_log(`[Boolean Feedback] ${data.key} = ${data.value}`)
        // Sync
        const d:Header = { name: 'set_boolean', data: data}
        this.websocket_manager.targets.forEach(x => x.websocket.send(JSON.stringify(d)))
    }

    private system_info = (info:SystemLoad, source:WebsocketPack | undefined) => {
        if(source == undefined) return
        source.information = info
        this.proxy?.delay({ key: source.uuid, value: source.information })
    }

    private pong = (info:number, source:WebsocketPack | undefined) => {
        if(source == undefined || source.last == undefined) return
        source.ms = Date.now() - source.last
        this.proxy?.delay({ key: source.uuid, value: source.ms })
    }
    //#endregion

    //#region Utility
    get_task_state_count(p:Project, t:Task){
        if (t.cronjob){
            return this.get_number(t.cronjobKey, p)
        }else{
            return 1
        }
    }

    get_number(key:string, p:Project){
        const f = p.parameter.numbers.find(x => x.name == key)
        if(f == undefined) return -1
        return f.value
    }

    private removeDups = (arr: any[]): any[] => {
        return [...new Set(arr)];
    }

    private parse = (str:string, paras:Array<KeyValue>):string => {
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
    
    private get_idle = ():Array<WebsocketPack> => {
        const all = this.websocket_manager.targets.filter(x => x.state != ExecuteState.RUNNING && x.websocket.readyState == WebSocket.OPEN)
        if(all.length != 0){
            return all
        }else return []
    }
    
    private set_multi = (key:string):number => {
        if(this.current_p == undefined) return 1
        const index = this.current_p.parameter.numbers.findIndex(x => x.name == key)
        return this.current_p.parameter.numbers[index].value
    }
    
    private validation = (projects:Array<Project>):boolean => {
        if (this.websocket_manager.targets.length == 0) {
            this.messager_log(`[Execute State] The execute node does not exists`)
            return false
        }
        projects.forEach(x => {
            x.task.forEach(t => {
                if(t.cronjob){
                    const index = x.parameter.numbers.findIndex(x => x.name == t.cronjobKey)
                    if(index == -1){
                        this.messager_log(`[Execute:CronJob] Project ${x.title} (${x.uuid}), Task ${t.title} (${t.uuid}), Has unknoed parameter: \"${t.cronjobKey}\"`)
                        this.messager_log(`[Execute:CronJob] Cron task registerd key not found`)
                        return false
                    }
                    else if (x.parameter.numbers[index].value == 0){
                        this.messager_log(`[Execute:CronJob] Project ${x.title} (${x.uuid}), Task ${t.title} (${t.uuid}), Has unknoed parameter: \"${t.cronjobKey}\"`)
                        this.messager_log(`[Execute:CronJob] Cron task value must bigger than 0`)
                        return false
                    }
                }
                if(t.cronjob && t.multi){
                    const index = x.parameter.numbers.findIndex(x => x.name == t.multiKey)
                    if(index == -1){
                        this.messager_log(`[Execute:Multi] Project ${x.title} (${x.uuid}), Task ${t.title} (${t.uuid}), Has unknoed parameter: \"${t.multiKey}\"`)
                        this.messager_log(`[Execute:Multi] Cron task registerd key not found`)
                        return false
                    }
                    else if (x.parameter.numbers[index].value == 0){
                        this.messager_log(`[Execute:Multi] Project ${x.title} (${x.uuid}), Task ${t.title} (${t.uuid}), Has unknoed parameter: \"${t.multiKey}\"`)
                        this.messager_log(`[Execute:Multi] Cron task value must bigger than 0`)
                        return false
                    }
                }
            })
        })
        return true
    }
    
    private _replacePara = (store:string, paras:Array<KeyValue>) => {
        const index = paras.findIndex(x => x.key == store)
        if(index == -1) return ''
        return paras[index].value
    }
    
    private _searchPara = (exp:string, paras:Array<KeyValue>) => {
        let d = exp
        paras.forEach(x => {
            d = d.replace(x.key, x.value)
        })
        return d
    }
    
    private replacePara = (text:string, paras:Array<KeyValue>):string => {
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

    private to_keyvalue = (p:Parameter):Array<KeyValue> => {
        const paras = [
            ...p.booleans.map(x => { return { key: x.name, value: x.value.toString() } }),
            ...p.numbers.map(x => { return { key: x.name, value: x.value.toString() } }),
            ...p.strings.map(x => { return { key: x.name, value: x.value.toString() } }),
        ]
        return paras
    }
    //#endregion

    //#region Helper
    private sync_para = (target:Parameter, source:WebsocketPack) => {
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
    private check_all_cron_end = () => {
        return this.current_cron.filter(x => !this.check_cron_end(x)).length == 0
    }
    private check_cron_end = (cron:CronJobState) => {
        return cron.work.filter(x => x.state != ExecuteState.FINISH && x.state != ExecuteState.ERROR).length == 0
    }
    private check_single_end = () => {
        if(this.current_t == undefined) return false
        return this.current_job.length == this.current_t.jobs.length && this.current_job.filter(y => y.state != ExecuteState.FINISH && y.state != ExecuteState.ERROR).length == 0
    }
    private get_task_count = (p:Project, t:Task) => {
        if(t.cronjob){
            const count = p.parameter.numbers.find(x => x.name == t.cronjobKey)?.value ?? -1
            return count
        }
        return 1
    }
    //#endregion
}