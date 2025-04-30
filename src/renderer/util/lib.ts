import { Ref } from "vue"
import { Library, LibType } from "../interface"

type Selection = () => Library | undefined

export interface CreateField {
    name: string
    type: LibType
}

export interface DATA {
    leftSize: number
    rightSize: number
    select: Library | undefined
    createModel: boolean
    isEdit: boolean
    editData: CreateField
    dirty: boolean
    titleError: boolean
    renameModal: boolean
    errorMessage: string
    messages:Array<string>
    search: string
}

export class Util_Lib {
    data:Ref<DATA>
    select: Selection

    constructor (_data:Ref<DATA>, _select: Selection){
        this.data = _data
        this.select = _select
    }

    createScript = () => {
        this.data.value.createModel = true
        this.data.value.isEdit = false
        this.data.value.editData = { name: "", type: LibType.LUA }
        this.data.value.errorMessage = ''
        this.data.value.titleError = false
    }
    
    editScript = () => {
        if(this.select() == undefined) return
        this.data.value.createModel = true
        this.data.value.isEdit = false
        this.data.value.editData = { name: this.select()!.name, type: this.select()!.type }
        this.data.value.errorMessage = ''
        this.data.value.titleError = false
    }
}