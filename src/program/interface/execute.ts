import { Job } from "./base"
import { ExecuteState } from "./enum"

export interface CronJobState  { 
    id:number, 
    uuid:string, 
    work: Array<WorkState>
}

export interface WorkState {
    uuid:string, 
    state:ExecuteState 
    job: Job
}