import { Ref } from "vue"
import { Database } from "../../../interface"
import { config_getter, DATA, save_and_update } from "."

export class Util_Server_Database {
    data:Ref<DATA>
    update:save_and_update
    config:config_getter

    constructor (_data:Ref<DATA>, _config:config_getter, _update:save_and_update){
        this.data = _data
        this.config = _config
        this.update = _update
    }

    addDatabase = (e:Database) => {
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
        if(this.config().config.isElectron){
            window.electronAPI.send('delete_database', e)
        }
        this.update()
    }
}