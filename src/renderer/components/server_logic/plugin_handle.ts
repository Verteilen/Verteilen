import { Emitter } from "mitt"
import { BusType } from "verteilen-core/src/interface"
import { Ref } from "vue"
import { Util_Server, DATA, save_and_update } from "."
import { BackendProxy } from "../../proxy"
import { ServerDelete } from "./delete"
import { ServerSave } from "./save"



export class Util_Server_Plugin {
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
}