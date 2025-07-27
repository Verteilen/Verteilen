// ========================
//                           
//      Share Codebase     
//                           
// ========================
import { ExecuteManager } from "../execute_manager"

export class Region_Job {
    target:ExecuteManager

    constructor(_target:ExecuteManager){
        this.target = _target
    }
}