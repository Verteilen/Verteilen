import { Ref } from "vue"
import { DataType, Parameter, ParameterContainer } from "../interface"

type getparameters = () => Array<Parameter>
type getparameter = () => Parameter | undefined

export interface EDIT {
    name: string
    type: number
}

export interface FILTER {
    showhidden: boolean
    showruntime: boolean
    type: number
}

export interface OPTION {
    title: string
    value:number
}

export interface CreateField {
    title: string
}

export interface DialogDATA {
    isEdit: boolean
    editData: CreateField
    errorMessage: string
    titleError: boolean
}

export interface DATA {
    selectModal: boolean
    selectSearch: string | undefined
    createModal: boolean
    createParameterModal:boolean
    editMode: boolean
    filterModal: boolean
    deleteModal: boolean
    createData: ParameterContainer
    editData: EDIT
    filter: FILTER
    buffer_filter: FILTER
    options: Array<OPTION>
    dirty: boolean
    buffer: Parameter
    errorMessage: string
    titleError: boolean
    search: string | undefined
    search_para: string | undefined
}

export class Util_Parameter {
    parameters:getparameters
    parameter:getparameter
    data:Ref<DATA>

    constructor(_data:Ref<DATA>, _getparameters:getparameters, _getparameter:getparameter){
        this.data = _data
        this.parameters = _getparameters
        this.parameter = _getparameter
    }

    updateParameter = () => {
        this.data.value.dirty = false
        this.data.value.buffer = this.parameter() ? 
            JSON.parse(JSON.stringify(this.parameter())) : 
            { uuid: '', title: '', canWrite: true, containers: [] }
    }

    createParameter = () => {
        this.data.value.createData = { name: '', value: 0, hidden: false, runtimeOnly: false, type: DataType.Number }
        this.data.value.createModal = true
        this.data.value.editMode = false
        this.data.value.errorMessage = ''
        this.data.value.titleError = false
    }

    editParameter = (oldname:string) => {
        const p = this.data.value.buffer.containers.find(x => x.name == oldname)
        if(p == undefined) return
        this.data.value.createData = JSON.parse(JSON.stringify(p))
        this.data.value.editData.name = p.name
        this.data.value.editData.type = p.type
        this.data.value.createModal = true
        this.data.value.editMode = true
        this.data.value.errorMessage = ''
        this.data.value.titleError = false
    }
}