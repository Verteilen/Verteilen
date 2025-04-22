import { Ref } from "vue"
import { Parameter } from "../interface"


export interface DATA {
    leftSize: number
    rightSize: number
    tag: number
    para: Parameter | undefined
    useCron: boolean
    skipModal: boolean
    process_type: number
}

export class Util_Console {
    data:Ref<DATA>

    constructor(_data:Ref<DATA>){
        this.data = _data
    }

}