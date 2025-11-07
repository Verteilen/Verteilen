import { nextTick, Ref } from "vue"
import { BusType, ProjectTable, Property, Task, TaskBase, TaskTable } from "../../interface"
import { DATA, save_and_update, Util_Server } from "."
import { Emitter } from "mitt"
import { BackendProxy } from "../../proxy"
import { ServerSave } from "./save"
import { ServerQuery } from "./query"


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
    public get query() : ServerQuery {
        return this.server.query
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
    public get selectProject() {
        return this.server.selectProject
    }
    public get selectTask() {
        return this.server.selectTask
    }

    //#region Task Page

    //#region Task CRUD
    /**
     * Add task through the dialog UI
     * @param v Array of task
     */
    addTask = (v:Array<TaskTable>) => {
        const ps = v.map(async x => {
            const jobsCreate = x.jobs.map(y => this.server.job.addJob(y))
            await Promise.all(jobsCreate)
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
        this.save.save_task(v).then(() => {
            this.query.load_tasks(this.selectProject.value!.uuid)
        })
    }
    
    deleteTask = (uuids:Array<string>) => {
        const ps = uuids.map(id => {
            const index = this.data.value.tasks.findIndex(x => x.uuid == id)
            if(index != -1) this.data.value.tasks.splice(index, 1)
            return this.server.del.delete_task(id) 
        })
        const ps2 = Promise.all(ps).then(() => {
            if(this.selectProject.value != undefined){
                for(let uuid of uuids){
                    const index = this.selectProject.value.tasks_uuid.findIndex(x => x == uuid)
                    this.selectProject.value.tasks_uuid.splice(index, 1)
                }
                this.save.save_project(this.selectProject.value)
            }
        })
        return ps2
    }
    //#endregion
    
    chooseTask = (uuid:string) => {
        this.data.value.selectTaskID = uuid
        this.data.value.page = 2 // Go to job page
    }

    bindingTask = (uuid:string) => {
        if(this.selectProject.value == undefined) return
        this.selectProject.value.database_uuid = uuid
        const buffer:ProjectTable = JSON.parse(JSON.stringify(this.selectProject.value, null, 4))
        delete buffer.s
        this.save.save_project(buffer).then(() => {
            this.query.load_project(buffer.uuid)
        })
    }
    
    reorderTask = (uuids:Array<string>) => {
        if(this.selectProject.value == undefined) return
        this.selectProject.value.tasks_uuid = uuids
        this.save.save_project(this.selectProject.value).then(() => {
            this.query.load_project(this.selectProject.value!.uuid).then(() => {
                this.query.load_tasks(this.selectProject.value!.uuid)
            })
        })
    }
    //#endregion

    //#region Job Page
    addProperty = () => {
        if(this.selectTask.value == undefined) return
        const p:Property = {
            name: "Default_Property",
            expression: "1 + 1",
            deep: 1
        }
        let count:number = 0
        while(this.selectTask.value.properties.find(x => x.name == p.name)){
            count = count + 1
            p.name = `Default_Property_${count}`
        }
        this.selectTask.value.properties.push(p)
        this.save.save_task(this.selectTask.value).then(() => {
            this.query.load_task(this.selectTask.value!.uuid)
        })
    }

    baseModify = (data:TaskBase) => {
        if(this.selectTask.value == undefined) return
        Object.assign(this.selectTask.value, data)
        this.save.save_task(this.selectTask.value).then(() => {
            this.query.load_task(this.selectTask.value!.uuid)
        })
    }
    //#endregion
}