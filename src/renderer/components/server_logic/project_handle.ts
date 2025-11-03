import { v6 as uuidv6 } from 'uuid'
import { Emitter } from "mitt";
import { Ref } from "vue";
import { BusType, DatabaseTable, Project, ProjectTable, Task } from "../../interface";
import { DATA, save_and_update, Util_Server } from ".";
import { BackendProxy } from "../../proxy";
import { ServerSave } from "./save";
import { Server } from "verteilen-core/src/server";

export class Util_Server_Project {
    server:Util_Server

    constructor (server:Util_Server){
        this.server = server
    }

    public get static_server () : Ref<Server | undefined> {
        return this.server.server
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

    //#region Project CRUD
    /**
     * Add project through the dialog UI
     * @param v Array of project
     */
    addProject = (v:Array<ProjectTable>) => {
        let dd = false
        const p = v.map(async x => {
            if(x.database != undefined){
                const uu = uuidv6()
                const b:DatabaseTable = {
                    ...x.database,
                    uuid: uu
                }
                await this.save.save_database(b)
                x.database_uuid = uu
                x.database = undefined
                dd = true
            }
            await this.server.task.addTask(x.tasks.map(y => ({ ...y, jobCount: y.jobs.length })))
            return this.save.save_project({
                ...x,
                tasks: [],
                tasks_uuid: x.tasks.map(y => y.uuid)
            })
        })
        return Promise.all(p).then(() => {
            if(dd) this.server.query.load_all_database()
            return this.server.query.load_all_project()
        })
    }
    cloneProject = (v:Array<string>) => {
        const s = this.data.value.projects.filter(x => v.includes(x.uuid))
        this.save.clone_projects(s)
    }
    /**
     * Add project through the import feature
     * @param v Array of project
     */
    importProject = (v:Array<Project>) => {
        v.forEach(x => {
            this.server.task.addTask(x.tasks.map(y => ({ ...y, jobCount: y.jobs.length })))
            x.tasks_uuid = x.tasks.map(y => y.uuid)
            x.tasks = []
            this.save.save_project({...x, taskCount: x.tasks.length})
        })
    }
    /**
     * **Edit Project Metadata**
     * @param uuid Target Project
     * @param v Change Data
     * @returns 
     */
    editProject = (uuid:string, v:ProjectTable) => {
        const selectp = this.data.value.projects.findIndex(x => x.uuid == uuid)
        if(selectp == -1) return
        this.data.value.projects[selectp] = v
        this.save.save_project(v)
    }
    deleteProject = (uuids:Array<string>, bind:boolean) => {
        uuids.forEach(id => {
            const index = this.data.value.projects.findIndex(x => x.uuid == id)
            if(index != -1) this.data.value.projects.splice(index, 1)
            this.server.del.delete_project(id, bind)
        })
    }
    //#endregion

    chooseProject = (uuid:string) => {
        this.data.value.selectProjectID = uuid
        this.data.value.page = 1 // Go to task page
    }
}