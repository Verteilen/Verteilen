// ========================
//                           
//      Share Codebase     
//                           
// ========================
import { Database, DataType, Header, Job, JobCategory, JobType, Task, SocketPack } from "../../interface"
import { ExecuteManager } from "../execute_manager"
import { Util_Parser } from "./util_parser"

export class Region_Job {
    target:ExecuteManager
    task:Task
    job: Job
    wss:SocketPack

    constructor(target:ExecuteManager, task:Task, job:Job, wss:SocketPack){
        this.target = target
        this.task = task
        this.job = job
        this.wss = wss
    }

    RUN = () => {
        const n:number = this.job.index!
        this.target.messager_log(`[Execute] Job Start ${n}  ${this.job.uuid}  ${this.wss.uuid}`)
        this.target.proxy?.executeJobStart([ this.job, n, this.wss.uuid ])
        
        this.string_args_transform(this.task, this.job, this.target.localPara!, n)
        const h:Header = {
            name: 'execute_job',
            channel: this.target.uuid,
            data: this.job
        }
        this.wss.current_job.push(this.job.runtime_uuid!)
        const stringdata = JSON.stringify(h)
        this.wss.socket.send(stringdata)
        this.target.jobstack = this.target.jobstack + 1
    }

    private string_args_transform = (task:Task, job:Job, localPara:Database, n:number) => {
        let e = this.database_update(localPara, n)
        e = this.property_update(task, e)

        for(let i = 0; i < job.string_args.length; i++){
            const b = job.string_args[i]
            if(b == null || b == undefined || b.length == 0) continue
            if(job.category == JobCategory.Execution && job.type == JobType.CREATE_FILE && i == 1) continue
            job.string_args[i] = e.replacePara(job.string_args[i])
            //messager_log(`String replace: "${b}" -> "${job.string_args[i]}"`)
        }
    }

    private property_update = (task:Task, e:Util_Parser) => {
        for(let j = 0; j < task.properties.length; j++){
            const target = task.properties[j];
            const times = target.deep ? target.deep : 1
            let act:any = target.expression
            for(let k = 0; k < times; k++){
                act = e.replacePara(`%{${act}}%`)
            }
            e.paras.push({ key: task.properties[j].name, value: act})
        }
        return e
    }

    private database_update = (localPara:Database, n?:number) => {
        const e = new Util_Parser([...Util_Parser.to_keyvalue(localPara)])
        if(n != undefined){
            e.paras.push({ key: 'ck', value: n.toString() })
        }
        localPara.containers.forEach((c, index) => {
            if(c.type != DataType.Expression) return
            c.value = e.replacePara(`%{${c.meta}}%`)
            e.paras.find(p => p.key == c.name)!.value = c.value
        })
        return e
    }
}