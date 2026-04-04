import { Ref } from "vue"
import { BusType, Database, DatabaseTable } from "verteilen-core/dist/interface"
import { DATA, save_and_update, Util_Server } from "."
import { BackendProxy } from "../../proxy"
import { Emitter } from "mitt"
import { ServerSave } from "./save"
import { ServerQuery } from "./query"
import { ServerDelete } from "./delete"

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

    addDatabase = (e:DatabaseTable) => {
        const b:DatabaseTable = JSON.parse(JSON.stringify(e))
        delete b.s
        this.save.save_database(b).then(() => {
            this.query.load_all_database()
        })
    }

    selectDatabase = (uuid:string) => {
        this.data.value.selectDatabaseID = uuid
    }

    editDatabase = (e:Database) => {
        const b:DatabaseTable = JSON.parse(JSON.stringify(e))
        delete b.s
        this.save.save_database(b).then(() => {
            this.query.load_all_database()
        })
    }

    deleteDatabase = (uuid:string) => {
        this.del.delete_database(uuid).then(() => {
            this.query.load_all_database()
        })
    }
}