import { parentPort } from 'worker_threads'
import { Header, Job } from '../interface'
import { ClientJobExecute } from './job_execute'

const messager = (msg:string, tag?:string) => {
    const d:Header = {
        name: 'messager',
        meta: tag,
        data: msg
    }
    parentPort?.postMessage(d)
}

const messager_log = (msg:string, tag?:string) => {
    const d:Header = {
        name: 'messager_log',
        meta: tag,
        data: msg
    }
    parentPort?.postMessage(d)
}

export function RUN(){
    console.log(process.env)
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
            parentPort?.postMessage(d)
            process.exit(1)
        })
    }
}