import { Ref } from "vue"
import { Database } from "../../interface"
import { DATA, save_and_update } from "."
import { BackendProxy } from "../../proxy"

export class Util_Server_Database {
    data:Ref<DATA>
    update:save_and_update
    backend:Ref<BackendProxy>

    constructor (_data:Ref<DATA>, backend:Ref<BackendProxy>, _update:save_and_update){
        this.data = _data
        this.backend = backend
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
        if(this.backend.value.config.isElectron){
            window.electronAPI.send('delete_database', e)
        }
        this.update()
    }
}