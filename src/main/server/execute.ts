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
            const all = current_nodes.filter(x => x.state == ExecuteState.STOP && x.websocket.readyState == WebSocket.OPEN)
            const all_uuids = all.map(x => x.uuid)
            const work_uuids = current_jobstate.map(x => x.id)
            const nowork = all_uuids.filter(x => !work_uuids.includes(x))
            if(nowork.length != 0){
                const index = all.findIndex(x => x.uuid == nowork[0])
                clearInterval(timer)
                resolve(all[index])
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
            if(!state) { // End
                const index = paras.findIndex(x => x.key == store)
                if(index != -1) buffer += paras[index].value
                store = ""
            }
        }
        if(state && v != '%') store += v
        if(!state && v != '%') buffer += v
    }
    return buffer
}

export const ExecuteJob = async (job:Job, wss:WebsocketPack):Promise<void> => {
    messager_log(`[執行狀態] 開始執行工作 ${job.uuid}  ${wss.uuid}`)
    current_web?.send('execute_job_start', job.uuid, wss.uuid)
    return new Promise(async (resolve, reject) => {
        for(let i = 0; i < job.string_args.length; i++){
            job.string_args[i] = replacePara(job.string_args[i], [{ key: 'ck', value: job.index }])
        }
        const h:Header = {
            name: 'execute_job',
            data: job
        }
        const stringdata = JSON.stringify(h)
        wss.websocket.send(stringdata)
        current_jobstate.push({ id: job.uuid, state: ExecuteState.RUNNING })
        if(job.index != undefined && job.index >= 0){
            current_cron[job.index].state = ExecuteState.RUNNING
        }

        let timer:any
        timer = setInterval(() => {
            const p = current_jobstate.findIndex(x => x.id == job.uuid)
            if(p != -1 && current_jobstate[p].state == ExecuteState.Finish){
                current_jobstate.splice(p, 1)
                messager_log(`[執行狀態] 結束執行工作 ${job.uuid}  ${wss.uuid}`)
                current_web?.send('execute_job_finish', job.uuid, wss.uuid)
                resolve()
                clearInterval(timer)
            }
        }, 1000);
    })
}

export const ExecuteTask = async (task:Task):Promise<void> => {
    return new Promise(async (resolve, reject) => {
        if(current == undefined) {
            reject(`[執行錯誤] 專案實體為 undefined`)
            return
        }
        messager_log(`[執行狀態] 偵測當前流程 cron 狀態: ${task.cronjob}`)
        if(task.cronjob){
            let count = current.parameter.numbers.find(x => x.name == task.cronjobKey)?.value ?? -1
            if(count == -1){
                reject(`[執行錯誤] 無法從專案 (${current.uuid}) 實體中找到, 數字參數: ${task.cronjobKey}`)
                return
            }

            messager_log(`[執行狀態] 開始執行流程 ${task.uuid} ${count}`)
            current_web?.send('execute_task_start', task.uuid, count)

            current_cron = []
            for(let index = 0; index < count; index++){
                current_cron.push({id: index, state: ExecuteState.STOP})
            }

            for(let index = 0; index < count; index++){
                const ns = await get_idle()
                current_web?.send('execute_subtask_start', index, ns.uuid)
                for(const x of task.jobs){
                    if(state == ExecuteState.STOP) return
                    const buff:Job = x
                    buff.index = index
                    await ExecuteJob(buff, ns).catch(err => messager_log(`[執行狀態] 執行工作錯誤: ${err}`))
                }
                current_web?.send('execute_subtask_end', index, ns.uuid)
            }
            messager_log(`[執行狀態] 結束執行流程 ${task.uuid}`)
            current_web?.send('execute_task_finish', task.uuid)
            resolve()
        }else{
            messager_log(`[執行狀態] 開始執行流程 ${task.uuid} 1`)
            current_web?.send('execute_task_start', task.uuid, 1)
            const ns = await get_idle()
            current_web?.send('execute_subtask_start', 0, ns.uuid)
            for(const x of task.jobs){
                if(state == ExecuteState.STOP) return
                const buff:Job = x
                buff.index = -1
                await ExecuteJob(buff, ns).catch(err => messager_log(`[執行狀態] 執行工作錯誤: ${err}`))
            }
            current_web?.send('execute_subtask_end', 0, ns.uuid)
            messager_log(`[執行狀態] 結束執行流程 ${task.uuid}`)
            current_web?.send('execute_task_finish', task.uuid)
            resolve()
        }
    })
    
}

export const ExecuteProject = async (project:Project):Promise<void> => {
    current = project
    messager_log(`[執行狀態] 開始執行專案 ${project.uuid}`)
    current_web?.send('execute_project_start', project.uuid)
    return new Promise(async (resolve, reject) => {
        for(const x of current_nodes){
            const h:Header = {
                name: 'set_parameter',
                message: '初始化參數列',
                data: project.parameter
            }
            x.websocket.send(JSON.stringify(h))
        }
        for(const x of project.task){
            if(state == ExecuteState.STOP) return
            await ExecuteTask(x).catch(err => messager_log(`[執行狀態] 執行流程錯誤: ${err}`))
        }
        messager_log(`[執行狀態] 結束執行專案 ${project.uuid}`)
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
    messager_log(`[執行狀態] 初始化成功, 進入執行階段`)
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
        messager_log(`[執行狀態] 單一回傳資訊接收 ${data.data}`)
        current_web.send('feedback_message', source.uuid, data.data)
    }
}

export const feedback_job = (data:FeedBack) => {
    if(current_web == undefined) return
    const index = current_jobstate.findIndex(x => x.id == data.job_uuid)
    if(index != -1){
        messager_log(`[執行狀態] 工作回傳 ${data.job_uuid} ${data.message}`)
        current_jobstate[index].state = ExecuteState.Finish
        current_web.send('feedback_message', data.job_uuid, data.message)
    }
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
