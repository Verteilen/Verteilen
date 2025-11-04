import { Ref } from "vue"
import { BusType, Job, JobTable, Property } from "../../interface"
import { DATA, save_and_update, Util_Server } from "."
import { Emitter } from "mitt"
import { BackendProxy } from "../../proxy"
import { ServerSave } from "./save"
import { ServerDelete } from "./delete"

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

    //#region Job CRUD
    addJob = (v:JobTable) => {
        return this.save.save_job(v)
    }

    cloneJob = (v:Array<string>) => {
        const s = this.data.value.jobs.filter(x => v.includes(x.uuid))
        this.save.clone_jobs(s)
    }

    editJob = (v:JobTable) => {
        return this.save.save_job(v)
    }
    
    deleteJob = (uuids:Array<string>) => {
        const ps = uuids.map(x => this.del.delete_job(x))
        return Promise.all(ps)
    }
    //#endregion
}