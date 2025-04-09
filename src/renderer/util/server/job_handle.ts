import { Ref } from "vue"
import { Job, Property } from "../../interface"
import { DATA, save_and_update } from "./server"

export class Util_Server_Job {
    data:Ref<DATA>
    update:save_and_update

    constructor (_data:Ref<DATA>, _update:save_and_update){
        this.data = _data
        this.update = _update
    }

    addJob = (v:Array<Job>) => {
        if(this.data.value.selectTask == undefined) return
        this.data.value.selectTask.jobs.push(...v)
        this.update()
    }

    editJob = (v:Array<Job>, v2:Array<Property>) => {
        if(this.data.value.selectTask == undefined) return
        this.data.value.selectTask.jobs = v
        this.data.value.selectTask.properties = v2
        this.update()
    }
    
    deleteJob = (uuids:Array<string>) => {
        uuids.forEach(id => {
            if(this.data.value.selectTask == undefined) return
            const index = this.data.value.selectTask.jobs.findIndex(x => x.uuid == id)
            if(index != -1) this.data.value.selectTask.jobs.splice(index, 1)
            if(this.data.value.selectTask?.uuid == id){
                this.data.value.selectTask = undefined
            }
        })
        this.update()
    }
}