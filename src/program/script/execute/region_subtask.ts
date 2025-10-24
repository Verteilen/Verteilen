// ========================
//                           
//      Share Codebase     
//                           
// ========================
import { ExecuteManager } from "../execute_manager"

export class Region_Subtask {
    target:ExecuteManager

    constructor(_target:ExecuteManager){
        this.target = _target
    }
}