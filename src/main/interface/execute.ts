import { ExecuteState } from "./enum"

export interface CronJobState  { 
    id:number, 
    state:ExecuteState 
}

export interface JobState  { 
    websocket_uuid:string, 
    state:ExecuteState 
}

export interface CronTaskState {
    websocket_uuid:string, 
    state:ExecuteState 
}