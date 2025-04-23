import { Ref } from "vue"
import { ExecuteRecord, ExecuteState, Record } from "../../interface"
import { ExecuteManager } from "../../script/execute_manager"
import { DATA, save_and_update } from "./server"


export class Util_Server_Console { 
    data:Ref<DATA>
    update:save_and_update

    constructor (_data:Ref<DATA>, _update:save_and_update){
        this.data = _data
        this.update = _update
    }

    receivedPack = (model:[ExecuteManager, ExecuteRecord], record:Record) => {
        const pass = model[0].Register(record.projects)
        if(pass == -1){
            model[1].running = false
            model[1].stop = true
            return false
        }
        model[1].projects = record.projects
        model[1].nodes = record.nodes
        model[1].project_state = model[1].projects.map(x => {
            return {
                uuid: x.uuid,
                state: ExecuteState.NONE
            }
        })
        model[1].project_index = pass
        model[1].project = record.projects[pass].uuid
        model[1].task_index = 0
        model[1].task_state = model[1].projects[0].task.map(x => {
            return {
                uuid: x.uuid,
                state: ExecuteState.NONE
            }
        })
        model[1].task_state[0].state = ExecuteState.RUNNING
        model[1].task_detail = []
        const count = model[1].projects[model[1].project_index]?.task[model[1].task_index]?.jobs.length ?? 0
        for(let i = 0; i < count; i++){
            model[1].task_detail.push({
                index: i,
                node: "",
                message: [],
                state: ExecuteState.NONE
            })
        }
        return true
    }
}