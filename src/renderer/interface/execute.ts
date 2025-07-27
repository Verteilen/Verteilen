// ========================
//                           
//      Share Codebase     
//                           
// ========================
import { Job } from "./base"
import { ExecuteState } from "./enum"

/**
 * The cronjob package, contain subtask state
 */
export interface CronJobState  {
    /**
     * The index order for the cron pacakge
     */
    id: number, 
    /**
     * The network instance uuid
     */
    uuid: string, 
    /**
     * All the job state package
     */
    work: Array<WorkState>
}

/**
 * The job package, contain jobs state
 */
export interface WorkState {
    /**
     * The network instance uuid
     */
    uuid: string
    /**
     * Runtime uuid
     */
    runtime: string
    /**
     * Job state
     */
    state: ExecuteState 
    /**
     * The job instance
     */
    job: Job
}