import { FeedBack, Header, Job, JobCategory, JobType, JobType2, JobType2Text, JobTypeText, Libraries, OnePath, Parameter, Setter, TwoPath } from "../interface";
import { i18n } from "../plugins/i18n";
import { Client } from "./client";
import { ClientLua } from "./lua";
import { ClientOS } from "./os";

/**
 * Execute worker, Execute the job container
 */
export class ClientExecute {
    parameter:Parameter | undefined = undefined
    libraries:Libraries | undefined = undefined

    messager:Function
    messager_log:Function
    client:Client
    lua:ClientLua
    os:ClientOS

    constructor(_messager:Function, _messager_log:Function, _lua:ClientLua, _os:ClientOS, _client:Client){
        this.client = _client
        this.lua = _lua
        this.os = _os
        this.messager = _messager
        this.messager_log = _messager_log
    }

    /**
     * The stop signal, It will trying to kill the process if currently running
     */
    stop_job = () => {
        this.os.stopall()
    }
    
    /**
     * The entry function to execute the job container
     * @param job Target job
     */
    execute_job = (job:Job) => {
        this.client.settag(job.uuid)
        this.messager_log(`[執行狀態] ${job.uuid}  ${job.category == JobCategory.Execution ? i18n.global.t(JobTypeText[job.type]) : i18n.global.t(JobType2Text[job.type])}`, this.client.tag)
        const child = job.category == JobCategory.Execution ? this.execute_job_exe(job) : this.execute_job_con(job)
        child.then(x => {
            this.messager_log(`[執行成功] ${x}`, this.client.tag)
            const data:FeedBack = { job_uuid: job.uuid, meta: 0, message: x }
            const h:Header = { name: 'feedback_job', data: data }
            this.client.source?.send(JSON.stringify(h))
            this.client.settag("")
        })
        .catch(err => {
            console.trace(err)
            this.messager_log(`[執行狀態] 錯誤: ${err}`, this.client.tag)
            const data:FeedBack = { job_uuid: job.uuid, meta: 1, message: err }
            const h:Header = { name: 'feedback_job', data: data }
            this.client.source?.send(JSON.stringify(h))
            this.client.settag("")
        })
    }
    
    /**
     * Execute the job that classify as run 
     * @param job Target job
     * @returns Promise instance
     */
    execute_job_exe = (job:Job) => {
        return new Promise<string>((resolve, reject) => {
            switch(job.type as JobType){
                case JobType.COPY_FILE:
                    {
                        const data:TwoPath = { from: job.string_args[0], to: job.string_args[1] }
                        this.os.file_copy(data)
                        resolve(`複製檔案成功, ${data.from}, ${data.to}`)
                        break
                    }
                case JobType.COPY_DIR:
                    {
                        const data:TwoPath = { from: job.string_args[0], to: job.string_args[1] }
                        this.os.dir_copy(data)
                        resolve(`複製資料夾成功, ${data.from}, ${data.to}`)
                        break
                    }
                case JobType.DELETE_FILE:
                    {
                        const data:OnePath = { path: job.string_args[0] }
                        this.os.file_delete(data)
                        resolve(`刪除檔案成功, ${data.path}`)
                        break
                    }
                case JobType.DELETE_DIR:
                    {
                        const data:OnePath = { path: job.string_args[0] }
                        this.os.dir_delete(data)
                        resolve(`刪除資料夾成功, ${data.path}`)
                        break
                    }
                case JobType.CREATE_DIR:
                    {
                        const data:OnePath = { path: job.string_args[0] }
                        this.os.dir_create(data)
                        resolve(`建立資料夾成功, ${data.path}`)
                        break
                    }
                case JobType.CREATE_FILE:
                    {
                        const data:TwoPath = { from: job.string_args[0], to: job.string_args[1] }
                        this.os.file_write(data)
                        resolve(`建立檔案成功, ${data.from} ${data.to}`)
                        break
                    }
                case JobType.RENAME:
                    {
                        const data:TwoPath = { from: job.string_args[0], to: job.string_args[1] }
                        this.os.rename(data)
                        resolve(`改名成功, ${data.from} ${data.to}`)
                        break
                    }
                case JobType.LUA:
                    {
                        this.lua.LuaExecuteWithLib(job.lua, job.string_args)
                        resolve(`執行 Lua 成功`)
                        break
                    }
                case JobType.COMMAND:
                    this.os.command(job.string_args[0], job.string_args[1], job.string_args[2]).then(m => {
                        resolve(m)
                    }).catch(err => {
                        reject(err)
                    })
                    break
            }
        })
    }
    
    /**
     * Execute the job that classify as condition
     * @param job Target job
     * @returns Promise instance
     */
    execute_job_con = (job:Job) => {
        return new Promise<string>((resolve, reject) => {
            switch(job.type as JobType2){
                case JobType2.CHECK_PATH:
                    {
                        const data:OnePath = { path: job.string_args[0] }
                        if(this.os.fs_exist(data)){
                            resolve(`路徑存在 ${data.path}`)
                        }else{
                            reject(`路徑不存在 ${data.path}`)
                        }
                        break
                    }
                case JobType2.LUA:
                    {
                        const r = this.lua.LuaExecuteWithLib(job.lua, job.string_args)
                        if(r != undefined && r == 0){
                            resolve(`執行 Lua 成功`)
                        }else{
                            reject(`執行 Lua 失敗`)
                        }
                        break
                    }
            }
        })
    }
    
    /**
     * Update parameter, Called by cluster server
     * @param data Target container
     */
    set_parameter = (data:Parameter) => {
        this.parameter = data
    }
    
    /**
     * Update libraries, Called by cluster server
     * @param data Target container
     */
    set_libs = (data:Libraries) => {
        this.libraries = data
    }
    
    /**
     * Update parameter string, Called by cluster server
     * @deprecated The method should not be used
     * @param data Target keyvalue
     */
    set_string = (data:Setter) => {
        if(this.parameter == undefined) return
        const index = this.parameter.strings.findIndex(x => x.name == data.key)
        if(index != -1) this.parameter.strings[index].value = data.value
        this.messager_log(`[Parameter string sync] ${data.key} = ${data.value}`, this.client.tag)
    }
    /**
     * Update parameter number, Called by cluster server
     * @deprecated The method should not be used
     * @param data Target keyvalue
     */
    set_number = (data:Setter) => {
        if(this.parameter == undefined) return
        const index = this.parameter.numbers.findIndex(x => x.name == data.key)
        if(index != -1) this.parameter.numbers[index].value = data.value
        this.messager_log(`[Parameter number sync] ${data.key} = ${data.value}`, this.client.tag)
    }
    /**
     * Update parameter boolean, Called by cluster server
     * @deprecated The method should not be used
     * @param data Target keyvalue
     */
    set_boolean = (data:Setter) => {
        if(this.parameter == undefined) return
        const index = this.parameter.booleans.findIndex(x => x.name == data.key)
        if(index != -1) this.parameter.booleans[index].value = data.value
        this.messager_log(`[Parameter boolean sync] ${data.key} = ${data.value}`, this.client.tag)
    }

    /**
     * Open shell console
     * @param input 
     */
    open_shell = (data:number) => {
        
    }

    /**
     * Open shell console
     * @param input 
     */
    enter_shell = (input:string) => {

    }

    /**
     * Open shell console
     * @param input 
     */
    close_shell = (data:number) => {

    }
}