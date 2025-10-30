import { Ref } from "vue"
import { BusType, Database, DatabaseTable } from "../../interface"
import { DATA, save_and_update, Util_Server } from "."
import { BackendProxy } from "../../proxy"
import { Emitter } from "mitt"
import { ServerSave } from "./save"

export class Util_Server_Database {
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

    addDatabase = (e:DatabaseTable) => {
        this.data.value.page = 3
        const b = JSON.parse(JSON.stringify(e))
        this.data.value.databases.push(b)
        this.data.value.selectDatabase = b
        this.update()
    }

    selectDatabase = (e:string) => {
        const index = this.data.value.databases.findIndex(x => x.uuid == e)
        if(index != -1){
            this.data.value.selectDatabase = this.data.value.databases[index]
        }
        this.update()
    }

    editDatabase = (e:Database) => {
        if(this.data.value.selectDatabase == undefined) return
        this.data.value.selectDatabase = JSON.parse(JSON.stringify(e))
        const index = this.data.value.databases.findIndex(x => x.uuid == e.uuid)
        this.data.value.databases[index] = this.data.value.selectDatabase!
        this.update()
    }

    deleteDatabase = (e:string) => {
        const index = this.data.value.databases.findIndex(x => x.uuid == e)
        if(index != -1){
            this.data.value.databases.splice(index, 1)
        }
        if(this.data.value.selectDatabase?.uuid == e){
            this.data.value.selectDatabase = undefined
        }
        if(this.backend.value.config.isElectron){
            window.electronAPI.send('delete_database', e)
        }
        this.update()
    }
}