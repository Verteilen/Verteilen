import { v6 as uuid6 } from 'uuid';
import { Ref } from "vue";
import { DataType, Parameter, ParameterContainer } from "../interface";
import { i18n } from "../plugins/i18n";

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
    objectModal: boolean
    objectTarget: ParameterContainer | undefined
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

    confirmFilter = () => {
        this.data.value.filterModal = false
        this.data.value.filter = JSON.parse(JSON.stringify(this.data.value.buffer_filter))
    }

    confirmCreate = () => {
        if(this.data.value.createData.name.length == 0){
            this.data.value.errorMessage = i18n.global.t('error.title-needed')
            this.data.value.titleError = true
            return
        }
        if(this.data.value.buffer.containers.findIndex(x => x.name == this.data.value.createData.name) != -1){
            this.data.value.errorMessage = i18n.global.t('error.title-repeat')
            this.data.value.titleError = true
            return
        }
        this.data.value.buffer.containers.push(this.data.value.createData)
        this.data.value.createModal = false
        this.data.value.dirty = true
    }

    confirmEdit = () => {
        if(this.data.value.createData.name.length == 0){
            this.data.value.errorMessage = i18n.global.t('error.title-needed')
            this.data.value.titleError = true
            return
        }
        if(this.data.value.editData.name != this.data.value.createData.name){
            if(this.data.value.buffer.containers.findIndex(x => x.name == this.data.value.createData.name) != -1){
                this.data.value.errorMessage = i18n.global.t('error.title-repeat')
                this.data.value.titleError = true
                return
            }
        }
        if(this.data.value.createData.type != this.data.value.editData.type){
            if(this.data.value.createData.type = DataType.Boolean) this.data.value.createData.value = false
            else if(this.data.value.createData.type = DataType.Expression) this.data.value.createData.value = ''
            else if(this.data.value.createData.type = DataType.Number) this.data.value.createData.value = 0
            else if(this.data.value.createData.type = DataType.String) this.data.value.createData.value = ''
        }
        const index = this.data.value.buffer.containers.findIndex(x => x.name == this.data.value.editData.name)
        this.data.value.buffer.containers[index] = this.data.value.createData
        this.data.value.createModal = false
        this.data.value.dirty = true
    }

    confirmCreateSet = () => {
        if(this.data.value.editData.name.length == 0){
            this.data.value.errorMessage = i18n.global.t('error.title-needed')
            this.data.value.titleError = true
            return undefined
        }
        const d:Parameter = {
            title: this.data.value.editData.name,
            uuid: uuid6(),
            canWrite: true,
            containers: []
        }
        return d
    }

    confirmEditSet = () => {
        if(this.parameter() == undefined) return
        if(this.data.value.editData.name.length == 0){
            this.data.value.errorMessage = i18n.global.t('error.title-needed')
            this.data.value.titleError = true
            return
        }
        const d:Parameter = {
            title: this.data.value.editData.name,
            uuid: this.parameter()!.uuid,
            canWrite: this.parameter()!.canWrite,
            containers: this.parameter()!.containers
        }
        return d
    }

    filterOpen = () => {
        this.data.value.buffer_filter = JSON.parse(JSON.stringify(this.data.value.filter))
        this.data.value.filterModal = true
    }

    moveup = (name:string) => {
        const index = this.data.value.buffer.containers.findIndex(x => x.name == name)
        const bb = this.data.value.buffer.containers[index]
        this.data.value.buffer.containers[index] = this.data.value.buffer.containers[index - 1]
        this.data.value.buffer.containers[index - 1] = bb
        this.data.value.dirty = true
    }

    movedown = (name:string) => {
        const index = this.data.value.buffer.containers.findIndex(x => x.name == name)
        const bb = this.data.value.buffer.containers[index]
        this.data.value.buffer.containers[index] = this.data.value.buffer.containers[index + 1]
        this.data.value.buffer.containers[index + 1] = bb
        this.data.value.dirty = true
    }

    isFirst = (name:string) => {
        const index = this.data.value.buffer.containers.findIndex(x => x.name == name)
        return index <= 0
    }

    isLast = (name:string) => {
        const index = this.data.value.buffer.containers.findIndex(x => x.name == name)
        if(index == -1) return true
        return index == this.data.value.buffer.containers.length - 1
    }
}