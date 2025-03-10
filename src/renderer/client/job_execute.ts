import cluster from 'cluster';
import { Job, JobCategory, JobType, JobType2, JobType2Text, JobTypeText, Libraries, Messager, OnePath, Parameter, TwoPath } from "../interface";
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