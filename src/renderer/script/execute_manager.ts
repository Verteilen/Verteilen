import { formula, init } from "expressionparser";
import { CronJobState, ExecuteState, FeedBack, Header, Job, KeyValue, Project, Setter, Single, Task, WebsocketPack, WorkState } from "../interface";
import { emitter } from "../main";
import { messager_log } from "./debugger";
import { WebsocketManager } from "./socket_manager";

export class ExecuteManager{
    current_t:Task | undefined = undefined
    current_p:Project | undefined = undefined
    current_projects:Array<Project> = []
    current_cron:Array<CronJobState> = []
    current_job:Array<WorkState> = []
    current_multithread = 1
    state:ExecuteState = ExecuteState.NONE
    websocket_manager:WebsocketManager
    jobstack = 0

    constructor(_websocket_manager:WebsocketManager) {
        this.websocket_manager = _websocket_manager
        const typeMap:{ [key:string]:Function } = {
            'feedback_message': this.feedback_message,
            'feedback_job': this.feedback_job,
            'feedback_string': this.feedback_string,
            'feedback_boolean': this.feedback_boolean,
            'feedback_number': this.feedback_number
        }
        emitter.on('analysis', (d:{name:string, h:Header, c:WebsocketPack | undefined}) => {
            if(typeMap.hasOwnProperty(d.name)){
                const castingFunc = typeMap[d.h.name]
                castingFunc(d.h.data, d.c)
            }else{
                messager_log(`[來源資料解析] 解析失敗, 不明的來源標頭, name: ${d.name}, meta: ${d.h.meta}`)
            }
        })
    }

    ExecuteJob = (project:Project, task:Task, job:Job, wss:WebsocketPack, iscron:boolean) => {
        const n:number = job.index!
        messager_log(`[執行狀態] 開始執行工作 ${n}  ${job.uuid}  ${wss.uuid}`)
        emitter.emit('executeJobStart', { uuid: job.uuid, index: n, node: wss.uuid })

        for(let i = 0; i < job.string_args.length; i++){
            const b = job.string_args[i]
            if(b == null || b == undefined || b.length == 0) continue
            job.string_args[i] = this.replacePara(job.string_args[i], [{ key: 'ck', value: n.toString() }])
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
    
    ExecuteCronTask = (project:Project, task:Task, work:CronJobState, ns:WebsocketPack) => {
        if(ns.state != ExecuteState.RUNNING && ns.current_job == undefined){
            const index = work.work.findIndex(x => x.state == ExecuteState.NONE)
            if(index == 0){
                emitter.emit('executeSubtaskStart', { index:work.id - 1, node: ns.uuid })
            }
            if(index == -1) return
            work.work[index].state = ExecuteState.RUNNING
            const job:Job = JSON.parse(JSON.stringify(task.jobs[index]))
            job.index = work.id
            this.ExecuteJob(project, task, job, ns, true)
        }
    }
    
    ExecuteTask = (project:Project, task:Task) => {
        this.current_multithread = task.multi ? this.set_multi(task.multiKey) : 1
        let ns:Array<WebsocketPack> = []
        let allJobFinish = false
        let hasJob = task.jobs.length > 0

        if(!hasJob){
            emitter.emit('executeTaskStart', { uuid: task.uuid, count: 1 })
            emitter.emit('executeTaskFinish', task.uuid)
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
                    ns = this.get_idle()
                    const count = project.parameter.numbers.find(x => x.name == task.cronjobKey)?.value ?? -1
                    for(let index = 1; index < count + 1; index++){
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
                    emitter.emit('executeTaskStart', { uuid: task.uuid, count: count })
                }
                
                const allworks:Array<WorkState> = []
                this.current_cron.forEach(x => {
                    allworks.push(...x.work)
                })
                
                if(this.current_cron.length == task.jobs.length && allworks.filter(x => x.state != ExecuteState.FINISH).length == 0){
                    allJobFinish = true
                }else{
                    // Assign worker
                    const needs = this.current_cron.filter(x => x.uuid == '' && x.work.filter(y => y.state != ExecuteState.FINISH).length > 0)
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
                    ns = this.get_idle()
                    if(ns.length > 0) {
                        emitter.emit('executeTaskStart', { uuid: task.uuid, count: 1 })
                        emitter.emit('executeSubtaskStart', { index: 0, node: ns[0].uuid })
                        
                    }
                }

                if (ns.length > 0 && ns[0].websocket.readyState == WebSocket.OPEN)
                {
                    if(this.current_job.length == task.jobs.length && this.current_job.filter(x => x.state != ExecuteState.FINISH).length == 0){
                        allJobFinish = true
                    }else{
                        if(this.current_job.length != task.jobs.length){
                            this.current_job.push({
                                uuid: ns[0].uuid,
                                state: ExecuteState.RUNNING
                            })
                            console.log(ns[0].uuid)
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
            emitter.emit('executeTaskFinish', task.uuid)
            messager_log(`[執行狀態] 結束執行流程 ${task.uuid}`)
            const index = project.task.findIndex(x => x.uuid == task.uuid)
            if(index == project.task.length - 1){
                // Finish
                this.current_t = undefined
            }else{
                // Next
                this.current_t = project.task[index + 1]
            }
        }
    }

    ExecuteProject = (project:Project) => {
        if(this.current_t == undefined && project.task.length > 0){
            this.current_t = project.task[0]
            messager_log(`[執行狀態] 開始執行流程 ${this.current_t.uuid}`)
            messager_log(`[執行狀態] 偵測當前流程 cron 狀態: ${this.current_t.cronjob}`)
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
                messager_log(`[執行狀態] 結束執行專案 ${this.current_p?.uuid}`)
                this.current_p = undefined
                this.state = ExecuteState.FINISH
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
            messager_log(`[執行狀態] 開始執行專案 ${this.current_p.uuid}`)
            emitter.emit('executeProjectStart', this.current_p.uuid)
            for(const x of this.websocket_manager.targets){
                const h:Header = {
                    name: 'set_parameter',
                    message: '初始化參數列',
                    data: this.current_p.parameter
                }
                x.websocket.send(JSON.stringify(h))
            }
        }
        if (this.current_p != undefined){
            this.ExecuteProject(this.current_p)
        }
    }

    Register = (projects:Array<Project>):boolean => {
        messager_log(`[執行狀態] 開始執行, 專案數: ${projects.length}, 電腦數: ${this.websocket_manager.targets.length}`)
        if(this.state == ExecuteState.RUNNING){
            messager_log(`[執行狀態] 初始化錯誤, 目前已經有專案群集在列表中執行了`)
            return false
        }
        if(!this.validation(projects)){
            messager_log(`[執行狀態] 初始化錯誤, 檢查格式出現問題`)
            return false
        }
        this.state = ExecuteState.RUNNING
        messager_log(`[執行狀態] 初始化成功, 進入執行階段`)

        this.current_projects = projects
        return true
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
        if(this.state == ExecuteState.RUNNING && this.current_p != undefined){
            const h:Header = {
                name: 'set_parameter',
                message: '初始化參數列',
                data: this.current_p.parameter
            }
            source.websocket.send(JSON.stringify(h))
        }
    }

    SkipProject = () => {
        if (this.current_projects.length == 0) return
        if (this.current_p == undefined) {
            this.current_p = this.current_projects[0]
        } else {
            const index = this.current_projects.findIndex(x => x.uuid == this.current_p!.uuid)
            if (index == this.current_projects.length - 1){
                this.current_p = undefined
                this.state = ExecuteState.FINISH
                messager_log(`[執行狀態] 跳過專案 此為最後執行專案`)
            } else {
                this.current_p = this.current_projects[index + 1]
                messager_log(`[執行狀態] 跳過專案到 ${index}. ${this.current_p.uuid}`)
            }
        }
    }

    SkipTask = () => {
        if (this.current_p == undefined) return
        if (this.current_t == undefined){
            if(this.current_p.task.length > 0){
                this.current_t = this.current_p.task[0]
            } else {
                const index = this.current_p.task.findIndex(x => x.uuid == this.current_t!.uuid)
                if (index == this.current_p.task.length - 1){
                    this.current_t = undefined
                    messager_log(`[執行狀態] 跳過流程 此為最後執行流程`)
                } else {
                    this.current_t = this.current_p.task[index + 1]
                    messager_log(`[執行狀態] 跳過流程到 ${index}. ${this.current_t.uuid}`)
                }
            }
        }
    }

    //#region Feedback
    feedback_message = (data:Single, source:WebsocketPack | undefined) => {
        if(source == undefined) return
        if(this.state == ExecuteState.NONE) return
        messager_log(`[執行狀態] 單一回傳資訊接收 ${data.data}`)
        const d:Setter = { key: source.uuid, value: data.data}
        emitter.emit('feedbackMessage', d)
    }
    
    feedback_job = (data:FeedBack, source:WebsocketPack | undefined) => {
        if(source == undefined) return
        if(this.state == ExecuteState.NONE) return
        
        this.jobstack = this.jobstack - 1
        messager_log(`[執行狀態] 工作回傳 ${data.job_uuid} ${data.message}`)
        if(this.current_job.length > 0){
            emitter.emit('executeJobFinish', {uuid: data.job_uuid, index: 1, node: source.uuid})
            emitter.emit('executeSubtaskFinish', {index: 0, node: source.uuid})
            this.current_job[this.current_job.length - 1].state = ExecuteState.FINISH
        }
        if(this.current_cron.length > 0){
            const index = this.current_cron.findIndex(x => x.uuid == source.uuid)
            const jindex = this.current_cron[index].work.findIndex(x => x.uuid == data.job_uuid)
            emitter.emit('executeJobFinish', {uuid: data.job_uuid, index: this.current_cron[index].id - 1, node: source.uuid})
            this.current_cron[index].work[jindex].state = ExecuteState.FINISH
            if(this.current_cron[index].work.filter(x => x.state != ExecuteState.FINISH).length == 0){
                emitter.emit('executeSubtaskFinish', { index: this.current_cron[index].id - 1, node: this.current_cron[index].uuid })
                this.current_cron[index].uuid = ''
            }
        }
        source.state = ExecuteState.NONE
        source.current_job = undefined
        const d:Setter = { key: data.job_uuid, value: data.message}
        emitter.emit('feedbackMessage', d)
    }
    
    feedback_string = (data:Setter) => {
        if(this.current_p == undefined) return
        const index = this.current_p.parameter.strings.findIndex(x => x.name == data.key)
        if(index != -1) this.current_p.parameter.strings[index].value = data.value
        messager_log(`[字串參數回饋] ${data.key} = ${data.value}`)
        // Sync
        const d:Header = { name: 'set_string', data: data}
        this.websocket_manager.targets.forEach(x => x.websocket.send(JSON.stringify(d)))
    }
    
    feedback_number = (data:Setter) => {
        if(this.current_p == undefined) return
        const index = this.current_p.parameter.numbers.findIndex(x => x.name == data.key)
        if(index != -1) this.current_p.parameter.numbers[index].value = data.value
        messager_log(`[數字參數回饋] ${data.key} = ${data.value}`)
        // Sync
        const d:Header = { name: 'set_number', data: data}
        this.websocket_manager.targets.forEach(x => x.websocket.send(JSON.stringify(d)))
    }
    
    feedback_boolean = (data:Setter) => {
        if(this.current_p == undefined) return
        const index = this.current_p.parameter.booleans.findIndex(x => x.name == data.key)
        if(index != -1) this.current_p.parameter.booleans[index].value = data.value
        messager_log(`[布林參數回饋] ${data.key} = ${data.value}`)
        // Sync
        const d:Header = { name: 'set_boolean', data: data}
        this.websocket_manager.targets.forEach(x => x.websocket.send(JSON.stringify(d)))
    }
    //#endregion

    //#region Utility
    removeDups = (arr: any[]): any[] => {
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
            messager_log(`[檢測執行狀態] 目前沒有任何電腦可以進行運算`)
            return false
        }
        projects.forEach(x => {
            x.task.forEach(t => {
                if(t.cronjob){
                    const index = x.parameter.numbers.findIndex(x => x.name == t.cronjobKey)
                    if(index == -1){
                        messager_log(`[檢測執行狀態:CronJob] 專案 ${x.title} (${x.uuid}), 中的流程 ${t.title} (${t.uuid}), 中有未知的註冊參數: \"${t.cronjobKey}\"`)
                        messager_log(`[檢測執行狀態:CronJob] 群集流程 註冊的參數必須在專案的數字參數清單內找的到`)
                        return false
                    }
                    else if (x.parameter.numbers[index].value == 0){
                        messager_log(`[檢測執行狀態:CronJob] 專案 ${x.title} (${x.uuid}), 中的流程 ${t.title} (${t.uuid}), 中有未知的註冊參數: \"${t.cronjobKey}\"`)
                        messager_log(`[檢測執行狀態:CronJob] 群集流程 註冊的參數必須 大於 0`)
                        return false
                    }
                }
                if(t.cronjob && t.multi){
                    const index = x.parameter.numbers.findIndex(x => x.name == t.multiKey)
                    if(index == -1){
                        messager_log(`[檢測執行狀態:Multi] 專案 ${x.title} (${x.uuid}), 中的流程 ${t.title} (${t.uuid}), 中有未知的註冊參數: \"${t.multiKey}\"`)
                        messager_log(`[檢測執行狀態:Multi] 群集流程 註冊的參數必須在專案的數字參數清單內找的到`)
                        return false
                    }
                    else if (x.parameter.numbers[index].value == 0){
                        messager_log(`[檢測執行狀態:Multi] 專案 ${x.title} (${x.uuid}), 中的流程 ${t.title} (${t.uuid}), 中有未知的註冊參數: \"${t.multiKey}\"`)
                        messager_log(`[檢測執行狀態:Multi] 群集流程 註冊的參數必須 大於 0`)
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
    
    private replacePara = (text:string, v:Array<KeyValue>):string => {
        if (this.current_p == undefined) return text
        let buffer = ''
        let store = ''
        let state:boolean = false
        let useExp = false
        const paras = [
            ...this.current_p.parameter.booleans.map(x => { return { key: x.name, value: x.value.toString() } }),
            ...this.current_p.parameter.numbers.map(x => { return { key: x.name, value: x.value.toString() } }),
            ...this.current_p.parameter.strings.map(x => { return { key: x.name, value: x.value.toString() } }),
            ...v
        ]
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
    //#endregion
}