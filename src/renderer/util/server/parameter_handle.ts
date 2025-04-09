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

    editParameter = (e:Parameter) => {
        if(this.data.value.selectProject == undefined) return
        this.data.value.selectProject.parameter = e
        this.update()
    }
}