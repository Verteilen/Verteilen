import { Ref } from "vue"
import { Parameter } from "../../interface"
import { DATA, save_and_update } from "./server"



export class Util_Server_Parameter {
    data:Ref<DATA>
    update:save_and_update

    constructor (_data:Ref<DATA>, _update:save_and_update){
        this.data = _data
        this.update = _update
    }

    selectParameter = (e:string) => {
        const index = this.data.value.parameters.findIndex(x => x.uuid == e)
        if(index != -1){
            this.data.value.selectParameter = this.data.value.parameters[index]
        }
        this.update()
    }

    editParameter = (e:Parameter) => {
        if(this.data.value.selectParameter == undefined) return
        this.data.value.selectParameter = JSON.parse(JSON.stringify(e))
        const index = this.data.value.parameters.findIndex(x => x.uuid == e.uuid)
        this.data.value.parameters[index] = this.data.value.selectParameter!
        this.update()
    }

    deleteParameter = (e:string) => {
        const index = this.data.value.parameters.findIndex(x => x.uuid == e)
        if(index != -1){
            this.data.value.parameters.splice(index, 1)
        }
        if(this.data.value.selectParameter?.uuid == e){
            this.data.value.selectParameter = undefined
        }
        this.update()
    }
}