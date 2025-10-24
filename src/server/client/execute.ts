// ========================
//                           
//      Share Codebase     
//                           
// ========================
import { ChildProcess, spawn } from 'child_process';
import { WebSocket } from 'ws';
import { DataType, FeedBack, Header, Job, JobCategory, JobType2Text, JobTypeText, Libraries, Messager, Messager_log, Parameter, Setter } from "../interface";
import { i18n } from "../plugins/i18n";
import { Client } from "./client";
import { ClientParameter } from './parameter';

/**
 * Execute worker, Execute the job container
 */
export class ClientExecute {
    uuid:string
    private parameter:Parameter | undefined = undefined
    private libraries:Libraries | undefined = undefined
    private tag: string = ''
    private workers:Array<ChildProcess> = []
    private client:Client;

    private messager:Messager
    private messager_log:Messager_log

    public get count() : number {
        return this.workers.length
    }

    constructor(_uuid:string, _messager:Messager, _messager_log:Messager_log, _client:Client){
        this.uuid =_uuid
        this.client = _client
        this.messager = _messager
        this.messager_log = _messager_log
    }

    /**
     * The stop signal, It will trying to kill the process if currently running
     */
    stop_job = () => {
        this.messager_log(`[Execute] Stop All: ${this.workers.length}`)
        this.workers.forEach(x => {
            x.stdin!.cork()
            x.stdin!.write("kill\n")
            x.stdin!.uncork()
            x.stdin!.end()
        })
    }
    
    /**
     * The entry function to execute the job container
     * @param job Target job
     */
    execute_job = (job:Job, source:WebSocket) => {
        this.messager_log(`[Execute] ${job.uuid}  ${job.category == JobCategory.Execution ? i18n.global.t(JobTypeText[job.type]) : i18n.global.t(JobType2Text[job.type])}`, job.uuid, job.runtime_uuid)
        this.tag = job.uuid
        this.execute_job_worker(job, source)
    }

    private execute_job_worker(job:Job, source:WebSocket){
        const child = spawn(Client.workerPath(), [], 
            { 
                stdio: ['pipe', 'pipe', 'pipe'],
                windowsHide: true,
                shell: true,
                env: {
                    ...process.env,
                    type: "JOB",
                    job: JSON.stringify(job),
                    plugin: JSON.stringify(this.client.plugins),
                    parameter: JSON.stringify(this.parameter),
                    libraries: JSON.stringify(this.libraries),
                }
        })
        child.stdin.setDefaultEncoding('utf-8')
        this.workers.push(child)
        const para = new ClientParameter(source)
        let k = "" 

        const workerFeedbackExec = (str:string) => {
            try{
                const msg:Header = JSON.parse(str)
                if(msg.name == 'messager'){
                    this.messager(msg.data, job.uuid)
                } 
                else if(msg.name == 'messager_log'){
                    this.messager_log(msg.data, job.uuid, job.runtime_uuid)
                }
                else if(msg.name == 'error'){
                    if(msg.data instanceof String) this.messager_log(msg.data.toString(), job.uuid, job.runtime_uuid)
                    else this.messager_log(JSON.stringify(msg.data), job.uuid, job.runtime_uuid)
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
                else if(msg.name == 'feedbackobject'){
                    para.feedbackobject(msg.data)
                }
                else if(msg.name == 'feedbacklist'){
                    para.feedbacklist(msg.data)
                }
                else if(msg.name == 'feedbackselect'){
                    para.feedbackselect(msg.data)
                }
            }catch(err:any){
                this.messager_log(`Error: ${str}`, job.uuid, job.runtime_uuid)
                this.messager_log(`(${err.code ?? 'unknown'}) ${err.message}`, job.uuid, job.runtime_uuid)
            }
        }
        const workerFeedback = (str:string) => {
            for(let i = 0; i < str.length; i++){
                if(str[i] != '\n') k += str[i]
                else {
                    workerFeedbackExec(k)
                    k = ''
                }
            }
        }

        child.on('error', (err) => {
            this.messager_log(`[Worker Error] ${err}`, job.uuid, job.runtime_uuid)
        })

        child.on('exit', (code, signal) => {
            this.job_finish(code || 0, signal || '', job, source)
            const index = this.workers.findIndex(x => x == child)
            if(index != -1) this.workers.splice(index, 1)
        })
        child.on('message', (message, sendHandle) => {
            workerFeedback(message.toString())
        })
        child.stdout.setEncoding('utf8');
        child.stdout.on('data', (chunk) => {
            workerFeedback(chunk.toString())
        })
        child.stderr.setEncoding('utf8');
        child.stderr.on('data', (chunk) => {
            workerFeedback(chunk.toString())
        })
    }

    private job_finish(code:number, signal:string, job:Job, source:WebSocket){
        this.messager_log( code == 0 ?
            `[Execute] Successfully: ${code} ${signal}` : 
            `[Execute] Error: ${code} ${signal}`, job.uuid, job.runtime_uuid)
        const data:FeedBack = { job_uuid: job.uuid, runtime_uuid: job.runtime_uuid!, meta: code, message: signal }
        const h:Header = { name: 'feedback_job', data: data }
        if(source.readyState == WebSocket.OPEN){
            source.send(JSON.stringify(h))
        }
        this.tag = ''
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
}