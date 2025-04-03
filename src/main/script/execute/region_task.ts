import { ExecuteManager } from "../execute_manager";

export class Region_Task {
    target:ExecuteManager

    constructor(_target:ExecuteManager){
        this.target = _target
    }
}