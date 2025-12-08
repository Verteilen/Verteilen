import { Ref } from "vue"
import { BusType, Job, JobTable, Property } from "verteilen-core/dist/interface"
import { DATA, save_and_update, Util_Server } from "."
import { Emitter } from "mitt"
import { BackendProxy } from "../../proxy"
import { ServerSave } from "./save"
import { ServerDelete } from "./delete"
import { ServerQuery } from "./query"

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
    public get query() : ServerQuery {
        return this.server.query
    }
    public get del() : ServerDelete {
        return this.server.del
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

    //#region Job CRUD
    addJob = async (v:JobTable) => {
        if(this.selectTask.value == undefined) return
        await this.save.save_job(v)
        this.selectTask.value.jobs_uuid.push(v.uuid)
        await this.save.save_task(this.selectTask.value)
        await this.query.load_task(this.selectTask.value.uuid)
        return this.query.load_jobs(this.selectTask.value.uuid)
    }

    cloneJob = async (v:Array<string>) => {
        if(this.selectTask.value == undefined) return
        const s = this.data.value.jobs.filter(x => v.includes(x.uuid))
        await this.save.clone_jobs(s)
        return this.query.load_jobs(this.selectTask.value.uuid)
    }

    editJob = async (v:JobTable) => {
        if(this.selectTask.value == undefined) return
        await this.save.save_job(v)
        return this.query.load_jobs(this.selectTask.value.uuid)
    }
    
    deleteJob = async (uuids:Array<string>) => {
        if(this.selectTask.value == undefined) return
        const ps = uuids.map(x => this.del.delete_job(x))
        await Promise.all(ps)
        return this.query.load_jobs(this.selectTask.value.uuid)
    }
    //#endregion
}