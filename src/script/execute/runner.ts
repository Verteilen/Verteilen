// ========================
//                           
//      Share Codebase     
//                           
// ========================
import { DataType, Project } from "../../interface";
import { ExecuteManager_Feedback } from "./feedback";
import { Util_Parser } from './util_parser';

/**
 * The execute runner
 */
export class ExecuteManager_Runner extends ExecuteManager_Feedback {
    /**
     * Boradcasting all the database and library to all the websocket nodes
     * @param p Target project
     */
    SyncDatabase = (p:Project) => {
        // Get the clone para from it
        this.localPara = JSON.parse(JSON.stringify(p.database))
        this.messager_log("[Execute] Sync Database !")
        this.messager_log("[Execute] Generate local database object")
        // Then phrase the expression to value
        for(let i = 0; i < this.localPara!.containers.length; i++){
            if(this.localPara!.containers[i].type == DataType.Expression && this.localPara!.containers[i].meta != undefined){
                const text = `%{${this.localPara!.containers[i].meta}}%`
                const e = new Util_Parser([...Util_Parser.to_keyvalue(this.localPara!)])
                this.localPara!.containers[i].value = e.replacePara(text)
            }
        }
        // Boradcasting
        this.sync_local_para(this.localPara!)
    }
}