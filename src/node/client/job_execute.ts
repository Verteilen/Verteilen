import cluster from 'cluster';
import { parentPort } from 'worker_threads';
import { Header, Job, JobCategory, JobType, JobType2, JobType2Text, JobTypeText, Libraries, Messager, OnePath, Parameter, TwoPath } from "../interface";
import { i18n } from "../plugins/i18n";
import { ClientJobParameter } from "./job_parameter";
import { ClientLua } from "./lua";
import { ClientOS } from "./os";

export class ClientJobExecute {
    private parameter:Parameter | undefined
    private libraries:Libraries | undefined
    private tag: string

    private messager:Messager
    private messager_log:Messager
    private lua:ClientLua
    private os:ClientOS
    private para:ClientJobParameter
    private job:Job

    constructor(_messager:Messager, _messager_log:Messager, _job:Job){
        this.messager = _messager
        this.messager_log = _messager_log
        this.tag = _job.uuid
        this.job = _job
        this.para = new ClientJobParameter()
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
            const d:Header = {
                name: "error",
                meta: "Execute job failed",
                data: err,
            }
            parentPort?.postMessage(d)
            process.exit(1)
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
                        if(this.os.fs_file_exist({path: data.from})){
                            this.os.file_copy(data)    
                            this.os.file_copy(data)
                            resolve(`Copy file successfully, ${data.from}, ${data.to}`)
                        }else{
                            reject(`File does not exist, ${data.from}`)
                        }
                        break
                    }
                case JobType.COPY_DIR:
                    {
                        const data:TwoPath = { from: this.job.string_args[0], to: this.job.string_args[1] }
                        if(this.os.fs_dir_exist({path: data.from})){
                            this.os.file_copy(data)    
                            this.os.file_copy(data)
                            resolve(`Copy dir successfully, ${data.from}, ${data.to}`)
                        }else{
                            reject(`Dir does not exist, ${data.from}`)
                        }
                        break
                    }
                case JobType.DELETE_FILE:
                    {
                        const data:OnePath = { path: this.job.string_args[0] }
                        this.os.file_delete(data)
                        resolve(`Delete file successfully, ${data.path}`)
                        break
                    }
                case JobType.DELETE_DIR:
                    {
                        const data:OnePath = { path: this.job.string_args[0] }
                        this.os.dir_delete(data)
                        resolve(`Delete folder successfully, ${data.path}`)
                        break
                    }
                case JobType.CREATE_DIR:
                    {
                        const data:OnePath = { path: this.job.string_args[0] }
                        this.os.dir_create(data)
                        resolve(`Create dir successfully, ${data.path}`)
                        break
                    }
                case JobType.CREATE_FILE:
                    {
                        const data:TwoPath = { from: this.job.string_args[0], to: this.job.string_args[1] }
                        this.os.file_write(data)
                        resolve(`Create file successfully, ${data.from} ${data.to}`)
                        break
                    }
                case JobType.RENAME:
                    {
                        const data:TwoPath = { from: this.job.string_args[0], to: this.job.string_args[1] }
                        this.os.rename(data)
                        resolve(`Rename successfully, ${data.from} ${data.to}`)
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
                            resolve(`Path exist ${data.path}`)
                        }else{
                            reject(`Path not exist ${data.path}`)
                        }
                        break
                    }
                case JobType2.LUA:
                    {
                        const r = this.lua.LuaExecuteWithLib(this.job.lua, this.job.string_args)
                        if(r != undefined && r == 0){
                            resolve(`Execute Lua successfully`)
                        }else{
                            reject(`Execute Lua failed`)
                        }
                        break
                    }
            }
        })
    }
}