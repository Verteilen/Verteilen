import { Ref } from "vue"
import { ExecuteRecord, Parameter } from "../interface"
import { ExecuteManager } from "../script/execute_manager"

type Model = () => [ExecuteManager, ExecuteRecord] | undefined

export interface DATA {
    leftSize: number
    rightSize: number
    tag: number
    para: Parameter | undefined
    useCron: boolean
    skipModal: boolean
    createModal: boolean
    process_type: number
}

export class Util_Console {
    model:Model
    data:Ref<DATA>

    constructor(_data:Ref<DATA>, _model:Model){
        this.model = _model
        this.data = _data
    }

    update_runtime_parameter = (d:Parameter, ) => {
        this.data.value.para = d
    }
}