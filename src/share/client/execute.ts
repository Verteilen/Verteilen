import cluster, { Worker } from 'cluster';
import WebSocket from 'ws';
import { DataType, FeedBack, Header, Job, JobCategory, JobType2Text, JobTypeText, Libraries, Messager, Parameter, Setter } from "../interface";
import { i18n } from "../plugins/i18n";
import { Client } from "./client";
import { ClientParameter } from './parameter';

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

    public get count() : number {
        return this.workers.length
    }

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
            else if(msg.name == 'error'){
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