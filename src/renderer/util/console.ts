import { Ref } from "vue"
import { ExecuteRecord, Parameter } from "../interface"
import { ExecuteManager } from "../script/execute_manager"

type Model = () => [ExecuteManager, ExecuteRecord] | undefined

export interface DATA {
    leftSize: number
    rightSize: number
    tag: number
    skipModal: boolean
    createModal: boolean
}

export class Util_Console {
    model:Model
    data:Ref<DATA>

    constructor(_data:Ref<DATA>, _model:Model){
        this.model = _model
        this.data = _data
    }
}