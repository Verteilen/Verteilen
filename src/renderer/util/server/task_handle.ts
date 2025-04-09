import { Ref } from "vue"
import { Task } from "../../interface"
import { DATA, save_and_update } from "./server"


export class Util_Server_Task {
    data:Ref<DATA>
    update:save_and_update

    constructor (_data:Ref<DATA>, _update:save_and_update){
        this.data = _data
        this.update = _update
    }

    addTask = (v:Array<Task>) => {
        if(this.data.value.selectProject == undefined) return
        this.data.value.selectProject.task.push(...v)
        this.update()
    }
    
    editTask = (id:string, v:Task) => {
        if(this.data.value.selectProject == undefined) return
        const selectt = this.data.value.selectProject.task.findIndex(x => x.uuid == id)
        if(selectt == -1) return
        this.data.value.selectProject.task[selectt] = v
        if(this.data.value.selectTask?.uuid == id){
            this.data.value.selectTask = v
        }
        this.update()
    }
    
    deleteTask = (uuids:Array<string>) => {
        uuids.forEach(id => {
            if(this.data.value.selectProject == undefined) return
            const index = this.data.value.selectProject.task.findIndex(x => x.uuid == id)
            if(index != -1) this.data.value.selectProject.task.splice(index, 1)
            if(this.data.value.selectTask?.uuid == id){
                this.data.value.selectTask = undefined
            }
        })
        this.update()
    }
    
    chooseTask = (uuid:string) => {
        this.data.value.selectTask = this.data.value.selectProject?.task.find(x => x.uuid == uuid)
        this.data.value.page = 2
        this.update()
    }
    
    moveupTask = (uuid:string) => {
        if(this.data.value.selectProject == undefined) return
        const index = this.data.value.selectProject.task.findIndex(x => x.uuid == uuid)
        if(index == -1) return
        const b = this.data.value.selectProject.task[index - 1]
        this.data.value.selectProject.task[index - 1] = this.data.value.selectProject.task[index]
        this.data.value.selectProject.task[index] = b
        this.update()
    }
    
    movedownTask = (uuid:string) => {
        if(this.data.value.selectProject == undefined) return
        const index = this.data.value.selectProject.task.findIndex(x => x.uuid == uuid)
        if(index == -1) return
        const b = this.data.value.selectProject.task[index + 1]
        this.data.value.selectProject.task[index + 1] = this.data.value.selectProject.task[index]
        this.data.value.selectProject.task[index] = b
        this.update()
    }
}