import { settag, source, tag } from "./client";
import { messager_log } from "./debugger";
import { FeedBack, Header, Job, JobType, JobTypeText, OnePath, Parameter, Setter, TwoPath } from "./interface";
import { LuaExecute } from "./lua";
import { command, dir_copy, dir_create, dir_delete, file_copy, file_delete, file_write, rename } from "./os";

export let current_job:Job | undefined = undefined
export let parameter:Parameter | undefined = undefined

export const execute_job = (job:Job) => {
    if(current_job != undefined) {
        messager_log(`[執行狀態] 錯誤! 已經有正在執行的工作`)
        return
    }
    settag(job.uuid)
    messager_log(`[執行狀態] ${job.uuid}  ${JobTypeText[job.type]}`, tag)
    current_job = job
    new Promise<string>((resolve, reject) => {
        switch(job.type as JobType){
            case JobType.COPY_FILE:
                {
                    const data:TwoPath = { from: job.string_args[0], to: job.string_args[1] }
                    file_copy(data)
                    resolve(`複製檔案成功, ${data.from}, ${data.to}`)
                    break
                }
            case JobType.COPY_DIR:
                {
                    const data:TwoPath = { from: job.string_args[0], to: job.string_args[1] }
                    dir_copy(data)
                    resolve(`複製資料夾成功, ${data.from}, ${data.to}`)
                    break
                }
            case JobType.DELETE_FILE:
                {
                    const data:OnePath = { path: job.string_args[0] }
                    file_delete(data)
                    resolve(`刪除檔案成功, ${data.path}`)
                    break
                }
            case JobType.DELETE_DIR:
                {
                    const data:OnePath = { path: job.string_args[0] }
                    dir_delete(data)
                    resolve(`刪除資料夾成功, ${data.path}`)
                    break
                }
            case JobType.CREATE_DIR:
                {
                    const data:OnePath = { path: job.string_args[0] }
                    dir_create(data)
                    resolve(`建立資料夾成功, ${data.path}`)
                    break
                }
            case JobType.CREATE_FILE:
                {
                    const data:TwoPath = { from: job.string_args[0], to: job.string_args[1] }
                    file_write(data)
                    resolve(`建立檔案成功, ${data.from} ${data.to}`)
                    break
                }
            case JobType.RENAME:
                {
                    const data:TwoPath = { from: job.string_args[0], to: job.string_args[1] }
                    rename(data)
                    resolve(`改名成功, ${data.from} ${data.to}`)
                    break
                }
            case JobType.LUA:
                {
                    LuaExecute(job.lua)
                    resolve(`執行 Lua 成功`)
                    break
                }
            case JobType.COMMAND:
                command(job.string_args[0], job.string_args[1], job.string_args[2]).then(m => {
                    resolve(m)
                }).catch(err => {
                    reject(err)
                })
                break
        }
    }).then(x => {
        messager_log(`[執行成功] ${x}`, tag)
        const data:FeedBack = { job_uuid: job.uuid, message: x }
        const h:Header = { name: 'feedback_job', data: data }
        source?.send(JSON.stringify(h))
        current_job = undefined
        settag(undefined)
    })
    .catch(err => {
        messager_log(`[執行狀態] 錯誤: ${err}`, tag)
        const data:FeedBack = { job_uuid: job.uuid, message: err }
        const h:Header = { name: 'feedback_job', data: data }
        source?.send(JSON.stringify(h))
        current_job = undefined
        settag(undefined)
    })
}

export const set_parameter = (data:Parameter) => {
    parameter = data
}

export const set_string = (data:Setter) => {
    if(parameter == undefined) return
    const index = parameter.strings.findIndex(x => x.name == data.key)
    if(index != -1) parameter.strings[index].value = data.value
    messager_log(`[子串參數同步] ${data.key} = ${data.value}`, tag)
}

export const set_number = (data:Setter) => {
    if(parameter == undefined) return
    const index = parameter.numbers.findIndex(x => x.name == data.key)
    if(index != -1) parameter.numbers[index].value = data.value
    messager_log(`[數字參數同步] ${data.key} = ${data.value}`, tag)
}

export const set_boolean = (data:Setter) => {
    if(parameter == undefined) return
    const index = parameter.booleans.findIndex(x => x.name == data.key)
    if(index != -1) parameter.booleans[index].value = data.value
    messager_log(`[布林參數同步] ${data.key} = ${data.value}`, tag)
}