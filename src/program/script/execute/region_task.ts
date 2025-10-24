// ========================
//                           
//      Share Codebase     
//                           
// ========================
import { ExecuteState, Task } from "../../interface";
import { ExecuteManager } from "../execute_manager";
import { Region_Subtask } from "./region_subtask";

export class Region_Task {
    target:ExecuteManager
    state: ExecuteState
    task: Task
    subtask: Region_Subtask | undefined
    constructor(_target:ExecuteManager, _task:Task){
        this.task = _task
        this.target = _target
        this.state = _task.jobs.length > 0 ? ExecuteState.NONE : ExecuteState.SKIP
        if(_task.jobs.length > 0){
            this.subtask = new Region_Subtask(_target)
        }
    }
}