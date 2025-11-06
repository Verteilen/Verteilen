import { v6 as uuid6 } from 'uuid';
import { ComputedRef, Ref } from "vue";
import { DataType, DataTypeBase, Database, DatabaseContainer, DatabaseTable, PluginPageData, Preference } from "../../interface";
import { i18n } from "../../plugins/i18n";
import { BackendProxy } from '../../proxy';

//#region Data
export interface EDIT extends CreateField{
    type: number
    useTemp: boolean
}

export interface FILTER {
    showhidden: boolean
    showruntime: boolean
    type: number
}

export interface CreateField {
    name: string
    canWrite: boolean
    temp: string | number | null
    useTemp: boolean
}

export interface OPTION {
    title: string
    value:number
}

export interface DialogDATA {
    isEdit: boolean
    errorMessage: string
    titleError: boolean
}

export interface DialogDATACreate extends DialogDATA{
    targetData: DatabaseContainer
    options: Array<OPTION>
}

export interface DialogDATACreateSet extends DialogDATA {
    targetData: EDIT
    plugin: PluginPageData
}

export type EmitType = {
    (e: 'added', data:DatabaseTable): void
    (e: 'edit', data:DatabaseTable): void
    (e: 'select', uuid:string): void
    (e: 'delete', uuid:string): void
    (e: 'return'): void
}

export interface DATA {
    fields: Array<any>
    importModal: boolean
    importData: File[]
    selectTempModel: boolean
    itemPrePage: number
    cloneModal: boolean
    cloneName: string
    objectModal: boolean
    selecterModal: boolean
    selecterModal1: boolean
    textareaModal: boolean
    listModal: boolean
    objectTarget: DatabaseContainer | undefined
    selecterTarget: DatabaseContainer | undefined
    textareaTarget: DatabaseContainer | undefined
    listTarget: DatabaseContainer | undefined
    selectModal: boolean
    selectSearch: string | undefined
    createModal: boolean
    createDatabaseModal:boolean
    editMode: boolean
    filterModal: boolean
    deleteModal: boolean
    createData: DatabaseContainer
    editData: EDIT
    filter: FILTER
    buffer_filter: FILTER
    options: Array<OPTION>
    options1: Array<OPTION>
    dirty: boolean
    buffer: DatabaseTable
    errorMessage: string
    titleError: boolean
    search: string | undefined
    search_para: string | undefined
    object_temp: string
}
//#endregion

export class Util_Database {
    backend: Ref<BackendProxy>
    data:Ref<DATA>
    emits:EmitType
    plugin: ComputedRef<PluginPageData>
    databases:ComputedRef<Array<DatabaseTable>>
    select:ComputedRef<DatabaseTable | undefined>

    constructor(
        backend: Ref<BackendProxy>, 
        data:Ref<DATA>, 
        emits:EmitType,
        plugin: ComputedRef<PluginPageData>, 
        databases:ComputedRef<Array<DatabaseTable>>, 
        select:ComputedRef<DatabaseTable | undefined>
    ){
        this.backend =backend
        this.emits = emits
        this.data = data
        this.plugin = plugin
        this.databases = databases
        this.select = select
    }

    createDatabase = () => {
        this.data.value.createData = { name: '', value: 0, hidden: false, runtimeOnly: false, type: DataType.Number }
        this.data.value.createModal = true
        this.data.value.editMode = false
        this.data.value.errorMessage = ''
        this.data.value.titleError = false
    }

    editDatabase = (oldname:string) => {
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
        const p:DatabaseContainer = JSON.parse(JSON.stringify(this.data.value.createData))
        if(p.type == DataType.String) p.value = ""
        else if(p.type == DataType.Object) p.value = {}
        else if(p.type == DataType.Boolean) p.value = true
        else if(p.type == DataType.Select) {
            p.meta = [0]
            p.value = 0
            p.config = { types: [DataTypeBase.Number] }
        }
        else if(p.type == DataType.List) p.value = [""]
        else if(p.type == DataType.Textarea) p.value = ""
        else if(p.type == DataType.Number || p.type == DataType.Expression) p.value = 0
        this.data.value.buffer.containers.push(p)
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

    confirmCreateSet = async ():Promise<Database | undefined> => {
        if(this.data.value.editData.name.length == 0){
            this.data.value.errorMessage = i18n.global.t('error.title-needed')
            this.data.value.titleError = true
            return undefined
        }
        if(this.data.value.editData.name != this.data.value.createData.name){
            if(this.data.value.buffer.containers.findIndex(x => x.name == this.data.value.createData.name) != -1){
                this.data.value.errorMessage = i18n.global.t('error.title-repeat')
                this.data.value.titleError = true
                return
            }
        }
        let buffer:Database = {
            title: this.data.value.editData.name,
            uuid: uuid6(),
            canWrite: this.data.value.editData.canWrite,
            containers: []
        }
        if(this.data.value.editData.useTemp){ // Referencing template data
            const select:string = this.data.value.editData.temp as string
            const tempSelect:Array<string> = select.split('/')
            if(tempSelect.length == 2){
                for(let x of this.plugin.value.plugins){
                    const p_temp = x.databases.find(y => y.group == tempSelect[0] && y.filename == tempSelect[1])
                    if(p_temp != undefined){
                        const templateData = await this.backend.value.invoke('get_database', x.title, p_temp.group, p_temp.filename + ".json")
                        const p:any = JSON.parse(templateData)
                        buffer = Object.assign(buffer, { containers: p })
                        break
                    }
                }
            }  
        }
        return buffer
    }

    confirmEditSet = async () => {
        if(this.select.value == undefined) return
        if(this.data.value.editData.name.length == 0){
            this.data.value.errorMessage = i18n.global.t('error.title-needed')
            this.data.value.titleError = true
            return
        }
        const d:Database = {
            title: this.data.value.editData.name,
            uuid: this.select.value!.uuid,
            canWrite: this.data.value.editData.canWrite,
            containers: this.select.value!.containers
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

    save = () => {
        this.emits('edit', this.data.value.buffer)
        this.data.value.dirty = false
    }

    //#region Utility
    isFirst = (name:string) => {
        const index = this.data.value.buffer.containers.findIndex(x => x.name == name)
        return index <= 0
    }
    isLast = (name:string) => {
        const index = this.data.value.buffer.containers.findIndex(x => x.name == name)
        if(index == -1) return true
        return index == this.data.value.buffer.containers.length - 1
    }
    move = (e:any, oge:any) => {
        //console.log("MOVE", e, oge)
    }
    end = (e:any) => {
        const n:number = e.newIndex
        const o:number = e.oldIndex
        const buffer = this.data.value.buffer.containers.splice(o, 1)
        this.data.value.buffer.containers.splice(n, 0, ...buffer)
        this.data.value.dirty = true
    }
    //#endregion
}