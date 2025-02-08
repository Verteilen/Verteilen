import { WebContents } from "electron"
import { WebSocket } from "ws"
import { messager_log } from "../debugger"
import { ExecuteState, FeedBack, Header, Job, KeyValue, Project, Setter, Single, Task, WebsocketPack, WebsocketPackState } from "../interface"

let current:Project | undefined = undefined
let current_projects:Array<Project> = []
let current_nodes:Array<WebsocketPackState> = []
let current_web:WebContents | undefined = undefined
let current_cron:Array<{ id:number, state:ExecuteState }> = []
let current_jobstate:Array<{ id:string, state:ExecuteState }> = []
let state:ExecuteState = ExecuteState.STOP

const get_idle = async ():Promise<WebsocketPackState> => {
    return new Promise<WebsocketPackState>((resolve, reject) => {
        let timer:any
        timer = setInterval(() => {
            const cn = current_nodes.filter(x => x.state == ExecuteState.STOP && x.websocket.readyState == WebSocket.OPEN)
            if(cn.length != 0){
                clearInterval(timer)
                resolve(cn[0])
            }
        }, 500)
        
    })
}

const validation = (projects:Array<Project>, nodes:Array<WebsocketPack>):boolean => {
    if (nodes.length == 0) {
        messager_log(`[檢測執行狀態] 目前沒有任何電腦可以進行運算`)
        return false
    }
    projects.forEach(x => {
        const numberkeys:Array<string> = x.parameter.numbers.map(x => x.name)
        x.task.forEach(t => {
            if(t.cronjob){
                if(!numberkeys.includes(t.cronjobKey)){
                    messager_log(`[檢測執行狀態] 專案 ${x.title} (${x.uuid}), 中的流程 ${t.title} (${t.uuid}), 中有未知的註冊參數: \"${t.cronjobKey}\"`)
                    messager_log(`[檢測執行狀態] 群集流程註冊的參數必須在專案的數字參數清單內找的到`)
                    return false
                }
            }
        })
    })
    return true
}

const replacePara = (text:string, v:Array<KeyValue>):string => {
    if (current == undefined) return text
    let buffer = ''
    let store = ''
    let state:boolean = false
    const paras = [
        ...current.parameter.booleans.map(x => { return { key: x.name, value: x.value.toString() } }),
        ...current.parameter.numbers.map(x => { return { key: x.name, value: x.value.toString() } }),
        ...current.parameter.strings.map(x => { return { key: x.name, value: x.value.toString() } }),
        ...v
    ]
    for(const v of text){
        if(v == '%'){
            state = !state
            if(!state) {
                store = ""
                const index = paras.findIndex(x => x.key == store)
                if(index != -1) buffer += paras[index].value
            }
        }
        if(!state && v != '%') buffer += v
    }
    return buffer
}

export const ExecuteJob = async (job:Job, wss:WebsocketPack):Promise<void> => {
    current_web?.send('execute_job_start', job.uuid)
    return new Promise(async (resolve, reject) => {
        for(let i = 0; i < job.string_args.length; i++){
            replacePara(job.string_args[i], [{ key: 'ck', value: job.index }])
        }
        const h:Header = {
            name: 'execute_job',
            data: job
        }
        wss.websocket.send(JSON.stringify(h))
        current_jobstate.push({ id: job.uuid, state: ExecuteState.RUNNING })
        if(job.index != undefined && job.index >= 0){
            current_cron[job.index].state = ExecuteState.RUNNING
        }

        let timer:any
        timer = setInterval(() => {
            const p = current_jobstate.findIndex(x => x.id)
            if(p != -1 && current_jobstate[p].state == ExecuteState.Finish){
                current_web?.send('execute_job_finish', job.uuid)
                resolve()
                clearInterval(timer)
            }
        }, 1000);
    })
}

export const ExecuteTask = async (task:Task):Promise<void> => {
    current_web?.send('execute_task_start', task.uuid)
    return new Promise(async (resolve, reject) => {
        if(current == undefined) {
            reject(`[執行錯誤] 專案實體為 undefined`)
            return
        }
        if(task.cronjob){
            let count = current.parameter.numbers.find(x => x.name == task.cronjobKey)?.value ?? -1
            if(count == -1){
                reject(`[執行錯誤] 無法從專案 (${current.uuid}) 實體中找到, 數字參數: ${task.cronjobKey}`)
                return
            }

            current_cron = []
            for(let index = 0; index < count; index++){
                current_cron.push({id: index, state: ExecuteState.STOP})
            }

            for(let index = 0; index < count; index++){
                const ns = await get_idle()
                for(const x of task.jobs){
                    if(state == ExecuteState.STOP) return
                    const buff:Job = Object.create(x)
                    buff.index = index
                    await ExecuteJob(buff, ns).catch(err => messager_log(`[執行狀態] 執行工作錯誤: ${err}`))
                }
            }
            current_web?.send('execute_task_finish', task.uuid)
            resolve()
        }else{
            const ns = await get_idle()
            for(const x of task.jobs){
                if(state == ExecuteState.STOP) return
                const buff:Job = Object.create(x)
                buff.index = -1
                await ExecuteJob(buff, ns).catch(err => messager_log(`[執行狀態] 執行工作錯誤: ${err}`))
            }
            current_web?.send('execute_task_finish', task.uuid)
            resolve()
        }
    })
    
}

export const ExecuteProject = async (project:Project):Promise<void> => {
    current = project
    current_web?.send('execute_project_start', project.uuid)
    return new Promise(async (resolve, reject) => {
        for(const x of project.task){
            if(state == ExecuteState.STOP) return
            await ExecuteTask(x).catch(err => messager_log(`[執行狀態] 執行流程錯誤: ${err}`))
        }
        current_web?.send('execute_project_finish', project.uuid)
        resolve()
    })
}

export const Execute = async (web:WebContents, projects:Array<Project>, nodes:Array<WebsocketPack>):Promise<boolean> => {
    messager_log(`[執行狀態] 開始執行, 專案數: ${projects.length}, 電腦數: ${nodes.length}`)
    if(state == ExecuteState.RUNNING){
        messager_log(`[執行狀態] 初始化錯誤, 目前已經有專案群集在列表中執行了`)
        return false
    }
    if(!validation(projects, nodes)){
        messager_log(`[執行狀態] 初始化錯誤, 檢查格式出現問題`)
        return false
    }
    state = ExecuteState.RUNNING
    return new Promise<boolean>(async (resolve, reject) => {
        current_projects = projects
        current_nodes = nodes.map(x => {
            return Object.assign(x, 
                { 
                    current_job: "", 
                    state: ExecuteState.STOP 
                }
            )
        })
        current_web = web
    
        for(let i = 0; i < projects.length; i++){
            if(state == ExecuteState.STOP) continue
            await ExecuteProject(projects[i]).catch(err => messager_log(`[執行狀態] 執行專案錯誤: ${err}`))
        }

        resolve(true)
    })
}

export const feedback_message = (data:Single, source:WebsocketPack | undefined) => {
    if(source == undefined || current_web == undefined) return
    const index = current_nodes.findIndex(x => x.uuid == source.uuid)
    if(index != -1) {
        current_web.send('feedback_message', source.uuid, data.data)
    }
}

export const feedback_job = (data:FeedBack) => {
    if(current_web == undefined) return
}

export const feedback_string = (data:Setter) => {
    if(current == undefined) return
    const index = current.parameter.strings.findIndex(x => x.name == data.key)
    if(index != -1) current.parameter.strings[index].value = data.value
    messager_log(`[字串參數回饋] ${data.key} = ${data.value}`)
    // Sync
    const d:Header = { name: 'set_string', data: data}
    current_nodes.forEach(x => x.websocket.send(JSON.stringify(d)))
}

export const feedback_number = (data:Setter) => {
    if(current == undefined) return
    const index = current.parameter.numbers.findIndex(x => x.name == data.key)
    if(index != -1) current.parameter.numbers[index].value = data.value
    messager_log(`[數字參數回饋] ${data.key} = ${data.value}`)
    // Sync
    const d:Header = { name: 'set_number', data: data}
    current_nodes.forEach(x => x.websocket.send(JSON.stringify(d)))
}

export const feedback_boolean = (data:Setter) => {
    if(current == undefined) return
    const index = current.parameter.booleans.findIndex(x => x.name == data.key)
    if(index != -1) current.parameter.booleans[index].value = data.value
    messager_log(`[布林參數回饋] ${data.key} = ${data.value}`)
    // Sync
    const d:Header = { name: 'set_boolean', data: data}
    current_nodes.forEach(x => x.websocket.send(JSON.stringify(d)))
}
