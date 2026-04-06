import { Preference } from "verteilen-core/dist/interface"
import { Ref } from "vue"
import { Util_Server, DATA } from "."
import { BackendProxy } from "../../proxy"

export class ServerDelete {
    server:Util_Server

    constructor(server:Util_Server) {
        this.server = server
    }
    
    public get data () : Ref<DATA> {
        return this.server.data
    }
    public get backend () : Ref<BackendProxy> {
        return this.server.backend
    }
    public get preference () : Ref<Preference> {
        return this.server.preference
    }

    delete_project = async (uuid:string, bind:boolean):Promise<void> => {
        const p = new Promise<void>(async (resolve) => {
            await this.backend.value.invoke("project_module:cascade_project", uuid, bind)
            resolve()
        })
        return p
    }

    delete_task = async (uuid:string):Promise<void> => {
        const p = new Promise<void>(async (resolve) => {
            await this.backend.value.invoke("project_module:cascade_task", uuid)
            resolve()
        })
        return p
    }

    delete_job = async (uuid:string, task_changed?:boolean):Promise<void> => {
        console.log("delete_job", uuid)
        const p = new Promise<void>((resolve) => {
            this.backend.value.invoke("project_module:cascade_job", uuid, task_changed)
            resolve()
        })
        return p
    }

    delete_database = async (uuid:string):Promise<void> => {
        //const p = !this.backend.value.config.haveBackend 
        const p = new Promise<void>((resolve) => {
            this.backend.value.send("delete_database", uuid)
            resolve()
        })
        return p
    }
}