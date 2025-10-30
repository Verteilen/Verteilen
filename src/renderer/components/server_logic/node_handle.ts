import { Ref } from "vue"
import { BusType, NodeTable } from "../../interface"
import { DATA, save_and_update, Util_Server } from "."
import { Emitter } from "mitt"
import { BackendProxy } from "../../proxy"
import { ServerSave } from "./save"

export class Util_Server_Node {
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

    server_clients_update = (v:Array<NodeTable>) => {
        const old:Array<NodeTable> = JSON.parse(JSON.stringify(this.data.value.nodes))
        this.data.value.nodes = v
        old.filter(x => x.s).forEach(x => {
            const index = this.data.value.nodes.findIndex(y => y.uuid == x.uuid)
            if(index != -1){
                this.data.value.nodes[index].s = true
            }
        })
        this.update()
    }
}