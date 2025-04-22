import { v6 as uuidv6 } from 'uuid';
import { AppConfig, Ref } from "vue";
import { Project, ProjectTable, ProjectTemplate, TemplateGroup } from "../interface";
import { i18n } from '../plugins/i18n';
import { GetFUNIQUE_GS4LUTProjectTemplate } from '../template/project/GS4_Lut';
import { GetAfterEffectTemplate, GetBlenderTemplate, GetDefaultProjectTemplate, GetFFmpeg_Image2VideoProjectTemplate, GetFUNIQUE_GS4ProjectTemplate, GetFUNIQUE_GS4Project_V2_Template } from "../template/projectTemplate";

type getproject = () => Array<Project>

/**
 * {@link ProjectTemplate}
 */
const groups:Array<TemplateGroup> = [
    { group: "Default", value: 0, template: GetDefaultProjectTemplate },
    { group: "GS4D", value: 10, template: GetFUNIQUE_GS4ProjectTemplate },
    { group: "GS4D", value: 11, template: GetFUNIQUE_GS4Project_V2_Template },
    { group: "GS4D", value: 12, template: GetFUNIQUE_GS4LUTProjectTemplate },
    { group: "FFmpeg", value: 20, template: GetFFmpeg_Image2VideoProjectTemplate },
    { group: "Blender", value: 30, template: GetBlenderTemplate },
    { group: "After Effect", value: 40, template: GetAfterEffectTemplate },
]

export interface CreateField {
    title: string
    description: string
    useTemp: boolean
    temp: number | null
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
    editData: CreateField
    errorMessage: string
    titleError: boolean
    temps:Array<Temp>
}

export const ValueToGroupName = (v:number) => groups.find(x => x.value == v)?.group
export const IndexToValue = (v:number) => groups[v].value

export class Util_Project {
    getproject:getproject
    data:Ref<DATA>
    
    public get projects() : Array<Project> {
        return this.getproject()
    }

    constructor(_data:Ref<DATA>, _getproject:getproject){
        this.data = _data
        this.getproject = _getproject
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
        this.data.value.editData = {title: selectp.title, description: selectp.description, useTemp: false, temp: 0};
        this.data.value.dialogModal = true;
        this.data.value.editUUID = uuid;
        this.data.value.errorMessage = ''
        this.data.value.titleError = false
    }

    updateProject = () => {
        this.data.value.items = this.projects.map(x => {
            return {
                s: false,
                ID: x.uuid,
                title: x.title,
                description: x.description,
                taskCount: x.task.length
            }
        })
        const allid = this.data.value.items.map(x => x.ID)
        this.data.value.selection = this.data.value.selection.filter(x => allid.includes(x))
    }

    createProject = () => {
        this.data.value.isEdit = false
        this.data.value.editData = {title: "", description: "", useTemp: false, temp: 0};
        this.data.value.dialogModal = true
        this.data.value.errorMessage = ''
        this.data.value.titleError = false
    }

    confirmCreate = () => {
        if(this.data.value.editData.title.length == 0){
            this.data.value.errorMessage = i18n.global.t('error.title-needed')
            this.data.value.titleError = true
            return
        }
        this.data.value.dialogModal = false
        let buffer:Project = { 
            uuid: uuidv6(),
            title: this.data.value.editData.title, 
            description: this.data.value.editData.description,
            parameter_uuid: '',
            parameter: {
                uuid: '',
                canWrite: true,
                containers: []
            },
            task: []
        }
        if (this.data.value.editData.useTemp){
            const index = this.data.value.editData.temp
            const p = groups.find(x => x.value == index)
            if(p != undefined) buffer = p.template(buffer)
            else console.error("Cannot find project template by id", index)
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