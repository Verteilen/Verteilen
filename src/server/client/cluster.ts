import { Header, Job } from '../interface'
import { ClientHTTP } from './http'
import { ClientJobExecute } from './job_execute'
import { ClientResource } from './resource'

/**
 * The message handle for reply
 * @param msg Message
 * @param tag Message prefix
 */
const messager = (msg:string, tag?:string) => {
    const d:Header = {
        name: 'messager',
        meta: tag,
        data: msg
    }
    console.log(JSON.stringify(d))
}

/**
 * The message handle for reply with print on screen ffeature
 * @param msg Message
 * @param tag Message prefix
 */
const messager_log = (msg:string, tag?:string, meta?:string) => {
    const d:Header = {
        name: 'messager_log',
        meta: meta,
        data: `[${tag}] ${msg}`
    }
    console.log(JSON.stringify(d))
}

function ERROR (err){
    const d:Header = {
        name: "error",
        meta: "Execute job failed",
        data: err,
    }
    console.log(JSON.stringify(d))
    process.exit(1)
}

/**
 * The entry point for the cluster thread.
 */
export function RUN(){
    // The cluster currently spawn should execute a job
    if(process.env.type == 'JOB'){
        if(process.env.job == undefined){
            process.exit(1)
        }
        const d:Job = JSON.parse(process.env.job)
        const worker = new ClientJobExecute(messager, messager_log, d, undefined)
        worker.execute().then(x => {
            process.exit(0)
        })
        .catch(err => ERROR(err))
    }
    else if (process.env.type == 'RESOURCE'){
        const r:ClientResource = new ClientResource()
        messager("Resource query")
        r.Query().then(x => {
            const h:Header = {
                name: 'resource',
                data: x
            }
            console.log(JSON.stringify(h))
        }).catch(err => ERROR(err))
    }
    else if (process.env.type == 'HTTP'){
        const m:string = process.env.method || 'GET'
        const u:string = process.env.url || ''
        const p:any = process.env.params
        const r:ClientHTTP = new ClientHTTP(u, m, p)
        r.RUN()
    }
    else{
        process.exit(1)
    }
}