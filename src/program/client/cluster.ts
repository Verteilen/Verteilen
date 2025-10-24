// ========================
//                           
//      Share Codebase     
//                           
// ========================
import { Header, Job, PluginList, ResourceType, SystemLoad } from '../interface'
import { ClientHTTP } from './http'
import { ClientJobExecute } from './job_execute'
import { ClientResource } from './resource'

let worker: ClientJobExecute | undefined = undefined

process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
    if(chunk.toString().startsWith("kill")){
        if(worker != undefined){
            worker.stop_all()
        }
        setTimeout(process.exit(1), 1000);
    }
})

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
/**
 * Return the error message to main thread
 * @param err Error instance
 */
const ERROR = (err:any) => {
    const d:Header = {
        name: "error",
        meta: "Execute job failed",
        data: `(${err.code ?? 'unknown'}) ${err.message}`,
    }
    console.log(JSON.stringify(d))
    process.exit(1)
}
/**
 * Job execute task
 */
const execute_job = () => {
    if(process.env.job == undefined || process.env.plugin == undefined){
        process.exit(1)
    }
    const d:Job = JSON.parse(process.env.job)
    const p:PluginList = JSON.parse(process.env.plugin)
    worker = new ClientJobExecute(messager, messager_log, d, undefined, p)
    worker.execute().then(x => {
        messager_log(x)
        process.exit(0)
    })
    .catch(err => ERROR(err))
}
/**
 * Query resource task
 */
const execute_resource = () => {
    const r:ClientResource = new ClientResource()
    messager("Resource query")
    const cache:SystemLoad | undefined = process.env.cache == undefined ? undefined : JSON.parse(process.env.cache)
    const type:ResourceType = cache == undefined ? ResourceType.ALL : ResourceType.BATTERY | ResourceType.LOAD | ResourceType.NETWORK | ResourceType.RAM
    r.Query(cache, type).then(x => {
        const h:Header = {
            name: 'resource',
            data: x
        }
        console.log(JSON.stringify(h))
    }).catch(err => ERROR(err))
}
/**
 * Query http task
 */
const execute_http = () => {
    const m:string = process.env.method || 'GET'
    const u:string = process.env.url || ''
    const p:any = process.env.params
    const r:ClientHTTP = new ClientHTTP(u, m, p)
    r.RUN()
}

/**
 * The entry point for the cluster thread.
 */
export function RUN(){
    // The cluster currently spawn should execute a job
    switch(process.env.type){
        case 'JOB':
            execute_job()
            break
        case 'RESOURCE':
            execute_resource()
            break
        case 'HTTP':
            execute_http()
            break
        default:
            process.exit(1)
    }
}