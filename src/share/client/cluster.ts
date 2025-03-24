import { Header, Job } from '../interface'
import { ClientJobExecute } from './job_execute'

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
const messager_log = (msg:string, tag?:string) => {
    const d:Header = {
        name: 'messager_log',
        meta: tag,
        data: msg
    }
    console.log(JSON.stringify(d))
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
        .catch(err => {
            const d:Header = {
                name: "error",
                meta: "Execute job failed",
                data: err,
            }
            console.log(JSON.stringify(d))
            process.exit(1)
        })
    }
}