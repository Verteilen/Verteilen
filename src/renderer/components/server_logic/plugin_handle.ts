import { Emitter } from "mitt"
import { BusType } from "verteilen-core/src/interface"
import { Ref } from "vue"
import { Util_Server, DATA, save_and_update } from "."
import { BackendProxy } from "../../proxy"
import { ServerDelete } from "./delete"
import { ServerSave } from "./save"
import { i18n } from "../../plugins/i18n"

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


    translate_helper = () => {
        const plugins = this.data.value.plugin.plugins
        const lan = i18n.global.locale.value
        plugins.forEach(plugin => {
            const i18n = plugin.i18n.find(x => x.key == lan)
            if(i18n == undefined) return
            const keys = Object.keys(i18n.value)

            if(plugin.title != undefined && keys.includes(plugin.title)){
                plugin.title = i18n.value[plugin.title]
            }
            if(plugin.description != undefined && keys.includes(plugin.description)){
                plugin.description = i18n.value[plugin.description]
            }
        })
    }
}