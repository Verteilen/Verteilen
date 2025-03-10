import cluster, { Worker } from 'cluster';
import WebSocket from 'ws';
import { DataType, FeedBack, Header, Job, JobCategory, JobType, JobType2, JobType2Text, JobTypeText, Libraries, Messager, OnePath, Parameter, Setter, TwoPath } from "../interface";
import { i18n } from "../plugins/i18n";
import { Client } from "./client";
import { ClientLua } from "./lua";
import { ClientOS } from "./os";
import { ClientParameter, ClientWorkerParameter } from './parameter';


/**
 * Execute worker, Execute the job container
 */
export class ClientExecute {
    private parameter:Parameter | undefined = undefined
    private libraries:Libraries | undefined = undefined
    private tag: string = ''
    private workers:Array<Worker> = []

    private messager:Messager
    private messager_log:Messager

    constructor(_messager:Messager, _messager_log:Messager, _client:Client){
        this.messager = _messager
        this.messager_log = _messager_log
    }

    /**
     * The stop signal, It will trying to kill the process if currently running
     */
    stop_job = () => {
        this.workers.forEach(x => x.kill())
    }
    
    /**
     * The entry function to execute the job container
     * @param job Target job
     */
    execute_job = (job:Job, source:WebSocket) => {
        if(!cluster.isPrimary) return
        this.messager_log(`[Execute] ${job.uuid}  ${job.category == JobCategory.Execution ? i18n.global.t(JobTypeText[job.type]) : i18n.global.t(JobType2Text[job.type])}`, this.tag)
        const para = new ClientParameter(source)
        const worker = cluster.fork({
            type: "JOB",
            job: JSON.stringify(job),
            parameter: JSON.stringify(this.parameter),
            libraries: JSON.stringify(this.libraries),
        })
        this.workers.push(worker)

        worker.on('message', (msg:Header) => {
            if(msg.name == 'messager'){
                this.messager(msg.data, msg.meta)
            } 
            else if(msg.name == 'messager_log'){
                this.messager_log(msg.data, msg.meta)
            }
            else if(msg.name == 'feedbackstring'){
                para.feedbackstring(msg.data)
            }
            else if(msg.name == 'feedbackboolean'){
                para.feedbackboolean(msg.data)
            }
            else if(msg.name == 'feedbacknumber'){
                para.feedbacknumber(msg.data)
            }
        })

        worker.on('error', (err) => {
            this.messager_log(`[Worker Error] ${err}`)
        })

        worker.on('exit', (code, signal) => {
            this.messager_log( code == 0 ?
                `[Execute] Successfully: ${code} ${signal}` : 
                `[Execute] Error: ${code} ${signal}`, this.tag)
            const data:FeedBack = { job_uuid: job.uuid, meta: code, message: signal }
            const h:Header = { name: 'feedback_job', data: data }
            source.send(JSON.stringify(h))
            this.tag = ''

            const index = this.workers.findIndex(x => x == worker)
            if(index != -1) this.workers.splice(index, 1)
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
        const index = this.parameter.containers.findIndex(x => x.name == data.key&& x.type == DataType.String)
        if(index != -1) this.parameter.containers[index].value = data.value
        this.messager_log(`[Parameter string sync] ${data.key} = ${data.value}`)
    }
    /**
     * Update parameter number, Called by cluster server
     * @deprecated The method should not be used
     * @param data Target keyvalue
     */
    set_number = (data:Setter) => {
        if(this.parameter == undefined) return
        const index = this.parameter.containers.findIndex(x => x.name == data.key && x.type == DataType.Number)
        if(index != -1) this.parameter.containers[index].value = data.value
        this.messager_log(`[Parameter number sync] ${data.key} = ${data.value}`)
    }
    /**
     * Update parameter boolean, Called by cluster server
     * @deprecated The method should not be used
     * @param data Target keyvalue
     */
    set_boolean = (data:Setter) => {
        if(this.parameter == undefined) return
        const index = this.parameter.containers.findIndex(x => x.name == data.key && x.type == DataType.Boolean)
        if(index != -1) this.parameter.containers[index].value = data.value
        this.messager_log(`[Parameter boolean sync] ${data.key} = ${data.value}`)
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

export class ClientJobExecute {
    private parameter:Parameter | undefined
    private libraries:Libraries | undefined
    private tag: string

    private messager:Messager
    private messager_log:Messager
    private lua:ClientLua
    private os:ClientOS
    private para:ClientWorkerParameter
    private job:Job

    constructor(_messager:Messager, _messager_log:Messager, _job:Job){
        this.messager = _messager
        this.messager_log = _messager_log
        this.tag = _job.uuid
        this.job = _job
        this.para = new ClientWorkerParameter()
        this.os = new ClientOS(() => this.tag, _messager, _messager_log)
        this.lua = new ClientLua(_messager, _messager_log)
        this.parameter = process.env.parameter != undefined ? JSON.parse(process.env.parameter) : undefined
        this.libraries = process.env.libraries != undefined ? JSON.parse(process.env.libraries) : undefined

        ClientLua.Init(_messager, _messager_log, this.os, this.para, 
            () => this.libraries,
            () => this.parameter
        )
    }

    /**
     * The entry function to execute the job container
     * @param job Target job
     */
    execute = () => {
        if(cluster.isPrimary) return
        this.messager_log(`[Execute] ${this.job.uuid}  ${this.job.category == JobCategory.Execution ? i18n.global.t(JobTypeText[this.job.type]) : i18n.global.t(JobType2Text[this.job.type])}`, this.tag)
        const child = this.job.category == JobCategory.Execution ? this.execute_job_exe() : this.execute_job_con()
        child.then(x => {
            process.exit(0)
        })
        .catch(err => {
            console.trace(err)
            process.exit(err)
        })
    }
    
    /**
     * Execute the job that classify as run 
     * @param job Target job
     * @returns Promise instance
     */
    private execute_job_exe = () => {
        return new Promise<string>((resolve, reject) => {
            switch(this.job.type as JobType){
                case JobType.COPY_FILE:
                    {
                        const data:TwoPath = { from: this.job.string_args[0], to: this.job.string_args[1] }
                        this.os.file_copy(data)
                        resolve(`複製檔案成功, ${data.from}, ${data.to}`)
                        break
                    }
                case JobType.COPY_DIR:
                    {
                        const data:TwoPath = { from: this.job.string_args[0], to: this.job.string_args[1] }
                        this.os.dir_copy(data)
                        resolve(`複製資料夾成功, ${data.from}, ${data.to}`)
                        break
                    }
                case JobType.DELETE_FILE:
                    {
                        const data:OnePath = { path: this.job.string_args[0] }
                        this.os.file_delete(data)
                        resolve(`刪除檔案成功, ${data.path}`)
                        break
                    }
                case JobType.DELETE_DIR:
                    {
                        const data:OnePath = { path: this.job.string_args[0] }
                        this.os.dir_delete(data)
                        resolve(`刪除資料夾成功, ${data.path}`)
                        break
                    }
                case JobType.CREATE_DIR:
                    {
                        const data:OnePath = { path: this.job.string_args[0] }
                        this.os.dir_create(data)
                        resolve(`建立資料夾成功, ${data.path}`)
                        break
                    }
                case JobType.CREATE_FILE:
                    {
                        const data:TwoPath = { from: this.job.string_args[0], to: this.job.string_args[1] }
                        this.os.file_write(data)
                        resolve(`建立檔案成功, ${data.from} ${data.to}`)
                        break
                    }
                case JobType.RENAME:
                    {
                        const data:TwoPath = { from: this.job.string_args[0], to: this.job.string_args[1] }
                        this.os.rename(data)
                        resolve(`改名成功, ${data.from} ${data.to}`)
                        break
                    }
                case JobType.LUA:
                    {
                        this.lua.LuaExecuteWithLib(this.job.lua, this.job.string_args)
                        resolve(`Execute Lua successfully`)
                        break
                    }
                case JobType.COMMAND:
                    {
                        this.os.command(this.job.string_args[0], this.job.string_args[1], this.job.string_args[2]).then(m => {
                            resolve(m)
                        }).catch(err => {
                            reject(err)
                        })
                        break
                    }
            }
        })
    }
    
    /**
     * Execute the job that classify as condition
     * @param job Target job
     * @returns Promise instance
     */
    private execute_job_con = () => {
        return new Promise<string>((resolve, reject) => {
            switch(this.job.type as JobType2){
                case JobType2.CHECK_PATH:
                    {
                        const data:OnePath = { path: this.job.string_args[0] }
                        if(this.os.fs_exist(data)){
                            resolve(`路徑存在 ${data.path}`)
                        }else{
                            reject(`路徑不存在 ${data.path}`)
                        }
                        break
                    }
                case JobType2.LUA:
                    {
                        const r = this.lua.LuaExecuteWithLib(this.job.lua, this.job.string_args)
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
}