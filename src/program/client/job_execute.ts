// ========================
//                           
//      Share Codebase     
//                           
// ========================
import WebSocket from "ws";
import { Job, JobCategory, JobType, JobType2, JobType2Text, JobTypeText, Libraries, Messager, Messager_log, OnePath, Parameter, PluginList, TwoPath } from "../interface";
import { i18n } from "../plugins/i18n";
import { ClientJavascript } from "./javascript";
import { ClientJobParameter } from "./job_parameter";
import { ClientOS } from "./os";

/**
 * The job execute worker\
 * This class should spawn by the cluster thread to prevent heavy calculation on the main thread
 */
export class ClientJobExecute {
    /**
     * Project parameters for references
     */
    parameter:Parameter | undefined
    /**
     * User library for scripts
     */
    libraries:Libraries | undefined
    /**
     * The job uuid\
     * This will put in the prefix of message
     */
    tag: string
    runtime:string

    private messager:Messager
    private messager_log:Messager_log
    private javascript:ClientJavascript
    private os:ClientOS
    private para:ClientJobParameter
    private job:Job
    private plugin:PluginList

    constructor(_messager:Messager, _messager_log:Messager_log, _job:Job, _source:WebSocket | undefined, _plugin:PluginList){
        this.messager = _messager
        this.messager_log = _messager_log
        this.tag = _job.uuid
        this.runtime = _job.runtime_uuid || ''
        this.job = _job
        this.plugin = _plugin
        this.para = new ClientJobParameter()
        this.os = new ClientOS(() => this.tag, () => this.job.runtime_uuid || '', _messager, _messager_log)
        this.javascript = new ClientJavascript(_messager, _messager_log, () => this.job)
        this.parameter = process.env.parameter != undefined ? JSON.parse(process.env.parameter) : undefined
        this.libraries = process.env.libraries != undefined ? JSON.parse(process.env.libraries) : undefined

        ClientJavascript.Init(_messager, _messager_log, this.os, this.para, 
            () => this.libraries,
            () => this.parameter,
            () => this.job
        )
    }

    /**
     * The entry function to execute the job container
     * @param job Target job
     */
    execute = () => {
        // Output the job type message to let user know what is going on
        this.messager_log(`[Execute] ${this.job.uuid}  ${this.job.category == JobCategory.Execution ? i18n.global.t(JobTypeText[this.job.type]) : i18n.global.t(JobType2Text[this.job.type])}`, this.tag, this.runtime)
        const child = this.job.category == JobCategory.Execution ? this.execute_job_exe() : this.execute_job_con()
        return child
    }

    stop_all = () => {
        this.os.stopall()
    }
    
    /**
     * Execute the job that classify as run 
     * @param job Target job
     * @returns Promise instance
     */
    private execute_job_exe = () => {
        return new Promise<string>(async (resolve, reject) => {
            switch(this.job.type as JobType){
                case JobType.COPY_FILE:
                    {
                        const data:TwoPath = { from: this.job.string_args[0], to: this.job.string_args[1] }
                        this.os.file_copy(data)
                        resolve(`Copy file successfully, ${data.from}, ${data.to}`)
                        break
                    }
                case JobType.COPY_DIR:
                    {
                        const data:TwoPath = { from: this.job.string_args[0], to: this.job.string_args[1] }
                        this.os.dir_copy(data)
                        resolve(`Copy dir successfully, ${data.from}, ${data.to}`)
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
                case JobType.JAVASCRIPT:
                    {
                        await this.javascript.JavascriptExecuteWithLib(this.job.script, this.job.string_args).then(() => {
                            resolve(`Execute Javascript successfully`)
                        }).catch(k => {
                            reject(k)
                        })
                        break
                    }
                case JobType.COMMAND:
                    {
                        this.os.command(this.job.string_args[1], this.job.string_args[2], this.job.string_args[0]).then(m => {
                            resolve(m)
                        }).catch(err => {
                            reject(err)
                        })
                        break
                    }
                case JobType.LIB_COMMAND:
                    {
                        const target = this.plugin.plugins.find(x => x.name == this.job.string_args[0])
                        if(target == undefined){
                            reject("Cannot find plugin " + this.job.string_args[0])
                            return
                        }

                        const archTarget = target.contents.find(x => x.arch == process.arch && x.platform == process.platform)
                        if(archTarget == undefined){
                            reject({
                                code: 1,
                                message: "Cannot find plugin match arch " + this.job.string_args[0] + "  " + process.arch
                            })
                            return
                        }

                        this.os.lib_command(archTarget.filename, this.job.string_args[1]).then(m => {
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
        return new Promise<string>(async (resolve, reject) => {
            switch(this.job.type as JobType2){
                case JobType2.CHECK_PATH:
                    {
                        const data:OnePath = { path: this.job.string_args[0] }
                        if(this.os.fs_exist(data)){
                            resolve(`Path exist ${data.path}`)
                        }else{
                            reject({
                                code: 2,
                                message: `Path not exist ${data.path}`
                            })
                        }
                        break
                    }
                case JobType2.JAVASCRIPT:
                    {
                        const r = await this.javascript.JavascriptExecuteWithLib(this.job.script, this.job.string_args)
                        if(r != undefined && r == 0){
                            resolve(`Execute Javascript successfully`)
                        }else{
                            reject({
                                code: 3,
                                message: `Execute Javascript failed`
                            })
                        }
                        break
                    }
            }
        })
    }
}
