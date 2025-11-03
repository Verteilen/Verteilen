import { Ref } from "vue"
import { BusType, Job, JobTable, Property } from "../../interface"
import { DATA, save_and_update, Util_Server } from "."
import { Emitter } from "mitt"
import { BackendProxy } from "../../proxy"
import { ServerSave } from "./save"

export class Util_Server_Job {
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

    //#region Job CRUD
    addJob = (v:JobTable) => {
        const ps = v.map(x => this.save.save_job(x))
        return Promise.all(ps)
    }

    cloneJob = (v:Array<string>) => {
        const s = this.data.value.jobs.filter(x => v.includes(x.uuid))
        this.save.clone_jobs(s)
    }

    editJob = (v:JobTable) => {
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
    //#endregion
}