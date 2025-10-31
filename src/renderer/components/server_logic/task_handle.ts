import { nextTick, Ref } from "vue"
import { BusType, Task, TaskTable } from "../../interface"
import { DATA, save_and_update, Util_Server } from "."
import { Emitter } from "mitt"
import { BackendProxy } from "../../proxy"
import { ServerSave } from "./save"


export class Util_Server_Task {
    server:Util_Server

    constructor (server:Util_Server){
        this.server = server
    }

    public get data() : Ref<DATA> {
        return this.server.data
    }
    public get backend() : Ref<BackendProxy> {
        return this.server.backend
    }
    public get save() : ServerSave {
        return this.server.save
    }
    public get update() : save_and_update {
        return this.server.allUpdate
    }
    public get updateOnly() : save_and_update {
        return this.server.update
    }
    public get emitter() : Emitter<BusType> {
        return this.server.emitter
    }

    //#region Task CRUD
    /**
     * Add task through the dialog UI
     * @param v Array of task
     */
    addTask = (v:Array<TaskTable>) => {
        const ps = v.map(async x => {
            const t = await this.server.job.addJob(x.jobs)
            await Promise.all(t)
            return this.save.save_task({
                ...x,
                jobs_uuid: x.jobs.map(y => y.uuid),
                jobs: [],
            })
        })
        return Promise.all(ps)
    }
    cloneTask = (v:Array<string>) => {
        const s = this.data.value.tasks.filter(x => v.includes(x.uuid))
        this.save.clone_tasks(s)
    }
    editTask = (uuid:string, v:TaskTable) => {
        const selectp = this.data.value.tasks.findIndex(x => x.uuid == uuid)
        if(selectp == -1) return
        this.data.value.tasks[selectp] = v
        this.save.save_task(v)
    }
    
    deleteTask = (uuids:Array<string>) => {
        const ps = uuids.map(id => {
            const index = this.data.value.tasks.findIndex(x => x.uuid == id)
            if(index != -1) this.data.value.tasks.splice(index, 1)
            return this.server.del.delete_task(id) 
        })
        const ps2 = Promise.all(ps).then(() => {
            if(this.data.value.selectProject != undefined){
                for(let uuid of uuids){
                    const index = this.data.value.selectProject.tasks_uuid.findIndex(x => x == uuid)
                    this.data.value.selectProject.tasks_uuid.splice(index, 1)
                }
                this.save.save_project(this.data.value.selectProject)
            }
        })
        return ps2
    }
    //#endregion
    
    chooseTask = (uuid:string) => {
        this.data.value.selectTask = this.data.value.tasks.find(x => x.uuid == uuid)
        this.data.value.page = 2 // Go to job page
    }

    bindingTask = (uuid:string) => {
        if(this.data.value.selectProject == undefined) return
        this.data.value.selectProject.database_uuid = uuid
        const index = this.data.value.projects.findIndex(x => x.uuid == uuid)
        if(index != -1) {
            this.data.value.projects[index].database_uuid = uuid
        }
        this.update()
    }
    
    moveupTask = (uuid:string) => {
        if(this.data.value.selectProject == undefined) return
        const index = this.data.value.selectProject.tasks.findIndex(x => x.uuid == uuid)
        if(index == -1) return
        const b = this.data.value.selectProject.tasks[index - 1]
        this.data.value.selectProject.tasks[index - 1] = this.data.value.selectProject.tasks[index]
        this.data.value.selectProject.tasks[index] = b
        this.update()
    }
    
    movedownTask = (uuid:string) => {
        if(this.data.value.selectProject == undefined) return
        const index = this.data.value.selectProject.tasks.findIndex(x => x.uuid == uuid)
        if(index == -1) return
        const b = this.data.value.selectProject.tasks[index + 1]
        this.data.value.selectProject.tasks[index + 1] = this.data.value.selectProject.tasks[index]
        this.data.value.selectProject.tasks[index] = b
        this.update()
    }
}