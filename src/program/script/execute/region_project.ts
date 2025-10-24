// ========================
//                           
//      Share Codebase     
//                           
// ========================
import { ExecuteState, Project } from "../../interface"
import { ExecuteManager } from "../execute_manager"
import { Region_Task } from "./region_task"

export class Region_Project {
    target:ExecuteManager
    state: ExecuteState
    project: Project
    task: Region_Task | undefined
    constructor(_target:ExecuteManager, _project:Project){
        this.project = _project
        this.target = _target
        this.state = _project.task.length > 0 ? ExecuteState.NONE : ExecuteState.SKIP
        if(_project.task.length > 0){
            this.task = new Region_Task(_target, _project.task[0])
        }
    }
}