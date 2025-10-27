import { v6 as uuidv6 } from 'uuid';
import { AppConfig, Plugin, Ref } from "vue";
import { Database, PluginPageData, Preference, Project, ProjectTable } from "../../interface";
import { i18n } from '../../plugins/i18n';
import { BuildIn_ProjectTempGroup } from '../../template/projectTemplate';
import { BackendProxy } from '../../proxy';

type getproject = () => Array<Project>
type getdatabases = () => Array<Database>
type getplugin = () => PluginPageData

export interface CreateField {
    title: string
    description?: string
    useTemp: boolean
    usePara: boolean
    database: string | null
    temp: number | string | null
}

export interface Temp {
    text: string
    group: string
    value: number
}

export interface PROPS {
    projects: Array<Project>
    config: AppConfig
}

export interface DATA {
    items:Array<ProjectTable>
    itemPrePage: number
    fields: Array<any>
    dialogModal:boolean
    importModal:boolean
    importData: File[]
    isEdit: boolean
    editData:CreateField
    temps:Array<Temp>
    editUUID:string
    deleteModal:boolean
    deleteBind: boolean
    deleteData:Array<string>
    errorMessage:string
    titleError:boolean
    search:string
    selection:Array<string>
}

export interface DialogDATA {
    isEdit: boolean
    databases: Array<Database>
    editData: CreateField
    errorMessage: string
    titleError: boolean
    temps:Array<Temp>
    preference?: Preference
}

export const ValueToGroupName = (v:number) => BuildIn_ProjectTempGroup.find(x => x.value == v)?.group
export const IndexToValue = (v:number) => BuildIn_ProjectTempGroup[v].value

export class Util_Project {
    backend: BackendProxy
    plugin: getplugin
    getproject:getproject
    getdatabases: getdatabases
    data:Ref<DATA>
    
    public get projects() : Array<Project> {
        return this.getproject()
    }

    constructor(_backend: BackendProxy, _plugin: getplugin, _data:Ref<DATA>, _getproject:getproject, _getdatabases:getdatabases){
        this.backend =_backend
        this.plugin = _plugin
        this.data = _data
        this.getproject = _getproject
        this.getdatabases = _getdatabases
    }

    isFirst = (uuid:string) => {
        const index = this.projects.findIndex(x => x.uuid == uuid)
        return index <= 0
    }
    isLast = (uuid:string) => {
        const index = this.projects.findIndex(x => x.uuid == uuid)
        if(index == -1) return true
        return index == this.projects.length - 1
    }

    dataedit = (uuid:string) => {
        this.data.value.isEdit = true
        const selectp = this.projects.find(x => x.uuid == uuid)
        if(selectp == undefined) return;
        this.data.value.editData = {title: selectp.title, usePara: false, description: selectp.description, useTemp: false, temp: 0, database: null};
        this.data.value.dialogModal = true;
        this.data.value.editUUID = uuid;
        this.data.value.errorMessage = ''
        this.data.value.titleError = false
    }

    updateProject = () => {
        this.data.value.items = this.projects.map(x => {
            return {
                s: false,
                uuid: x.uuid,
                title: x.title,
                description: x.description,
                database: x.database,
                database_uuid: x.database_uuid,
                task: x.task,
                taskCount: x.task.length
            }
        })
        const allid = this.data.value.items.map(x => x.uuid)
        this.data.value.selection = this.data.value.selection.filter(x => allid.includes(x))
    }

    createProject = () => {
        this.data.value.isEdit = false
        this.data.value.editData = {title: "", description: "", usePara: false, useTemp: false, temp: 0, database: null};
        this.data.value.dialogModal = true
        this.data.value.errorMessage = ''
        this.data.value.titleError = false
    }

    confirmCreate = async () => {
        if(this.data.value.editData.title.length == 0){
            this.data.value.errorMessage = i18n.global.t('error.title-needed')
            this.data.value.titleError = true
            return undefined
        }
        this.data.value.dialogModal = false
        let buffer:Project = { 
            uuid: uuidv6(),
            title: this.data.value.editData.title, 
            description: this.data.value.editData.description,
            database_uuid: this.data.value.editData.database ?? '',
            database: undefined,
            task: []
        }
        if (this.data.value.editData.useTemp){
            const index = this.data.value.editData.temp
            const p = BuildIn_ProjectTempGroup.find(x => x.value === index)
            if(p != undefined) {
                buffer = JSON.parse(JSON.stringify(p.template!(buffer)))
            }else{
                const select = this.data.value.editData.temp as string
                let mfilename: string = ""
                let mGruop: string = ""
                this.plugin().templates.forEach(x => {
                    x.project.forEach(y => {
                        if(y.title == select){
                            mfilename = y.filename!
                            mGruop = y.group
                        }
                    })
                })
                let p = JSON.parse(await this.backend.invoke('get_template', mGruop, mfilename))
                delete p.uuid
                delete p.title
                delete p.description
                buffer = Object.assign(buffer, p)
            }
        }
        if(this.data.value.editData.usePara){
            const target = this.getdatabases().find(x => x.uuid == this.data.value.editData.database)
            if(target != undefined){
                buffer.database_uuid = target.uuid
                buffer.database = undefined
            } else console.error("Cannot find database template by id", this.data.value.editData.database)
        }
        return buffer
    }

    confirmEdit = () => {
        if(this.data.value.editData.title.length == 0){
            this.data.value.errorMessage = i18n.global.t('error.title-needed')
            this.data.value.titleError = true
            return undefined
        }
        const selectp = this.projects.find(x => x.uuid == this.data.value.editUUID)
        return selectp
    }
}