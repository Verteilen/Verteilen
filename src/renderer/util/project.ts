import { v6 as uuidv6 } from 'uuid';
import { AppConfig, Ref } from "vue";
import { Parameter, Project, ProjectTable, ProjectTemplate, TemplateGroup } from "../interface";
import { i18n } from '../plugins/i18n';
import { GetAfterEffectTemplate, GetBlenderTemplate, GetDefaultProjectTemplate, GetFFmpeg_Image2VideoProjectTemplate, GetFUNIQUE_GS4ProjectTemplate_BlendPrepare, GetFUNIQUE_GS4ProjectTemplate_BlendResult, GetFUNIQUE_GS4ProjectTemplate_Colmap, GetFUNIQUE_GS4ProjectTemplate_Generate_IFrame, GetFUNIQUE_GS4ProjectTemplate_Generate_Prepare, GetFUNIQUE_GS4ProjectTemplate_LUT, GetFUNIQUE_GS4ProjectTemplate_PLYOutput } from "../template/projectTemplate";
import { GetFUNIQUE_GS4ProjectTemplate_Mask } from '../template/project/GS4/GenerateMaskedPictures';
import { GetFUNIQUE_GS4ProjectTemplate_Full } from '../template/project/GS4/GS4D_Full';

type getproject = () => Array<Project>
type getparameters = () => Array<Parameter>

/**
 * {@link ProjectTemplate}
 */
const groups:Array<TemplateGroup> = [
    { group: "Default", value: 0, template: GetDefaultProjectTemplate },
    { group: "GS4D", value: 100, template: GetFUNIQUE_GS4ProjectTemplate_Full },
    { group: "GS4D", value: 101, template: GetFUNIQUE_GS4ProjectTemplate_Generate_Prepare },
    { group: "GS4D", value: 102, template: GetFUNIQUE_GS4ProjectTemplate_Colmap },
    { group: "GS4D", value: 103, template: GetFUNIQUE_GS4ProjectTemplate_Generate_IFrame },
    { group: "GS4D", value: 104, template: GetFUNIQUE_GS4ProjectTemplate_BlendPrepare },
    { group: "GS4D", value: 105, template: GetFUNIQUE_GS4ProjectTemplate_BlendResult },
    { group: "GS4D", value: 106, template: GetFUNIQUE_GS4ProjectTemplate_PLYOutput },
    { group: "GS4D", value: 107, template: GetFUNIQUE_GS4ProjectTemplate_LUT },
    { group: "GS4D", value: 108, template: GetFUNIQUE_GS4ProjectTemplate_Mask },
    { group: "FFmpeg", value: 200, template: GetFFmpeg_Image2VideoProjectTemplate },
    { group: "Blender", value: 300, template: GetBlenderTemplate },
    { group: "After Effect", value: 400, template: GetAfterEffectTemplate },
]

export interface CreateField {
    title: string
    description: string
    useTemp: boolean
    usePara: boolean
    parameter: string | null
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
    parameters: Array<Parameter>
    editData: CreateField
    errorMessage: string
    titleError: boolean
    temps:Array<Temp>
}

export const ValueToGroupName = (v:number) => groups.find(x => x.value == v)?.group
export const IndexToValue = (v:number) => groups[v].value

export class Util_Project {
    getproject:getproject
    getparameters: getparameters
    data:Ref<DATA>
    
    public get projects() : Array<Project> {
        return this.getproject()
    }

    constructor(_data:Ref<DATA>, _getproject:getproject, _getparameters:getparameters){
        this.data = _data
        this.getproject = _getproject
        this.getparameters = _getparameters
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
        this.data.value.editData = {title: selectp.title, usePara: false, description: selectp.description, useTemp: false, temp: 0, parameter: null};
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
        this.data.value.editData = {title: "", description: "", usePara: false, useTemp: false, temp: 0, parameter: null};
        this.data.value.dialogModal = true
        this.data.value.errorMessage = ''
        this.data.value.titleError = false
    }

    confirmCreate = () => {
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
            parameter_uuid: this.data.value.editData.parameter ?? '',
            parameter: undefined,
            task: []
        }
        if (this.data.value.editData.useTemp){
            const index = this.data.value.editData.temp
            const p = groups.find(x => x.value == index)
            if(p != undefined) {
                buffer = JSON.parse(JSON.stringify(p.template(buffer)))
            }
            else console.error("Cannot find project template by id", index)
        }
        if(this.data.value.editData.usePara){
            const target = this.getparameters().find(x => x.uuid == this.data.value.editData.parameter)
            if(target != undefined){
                buffer.parameter_uuid = target.uuid
                buffer.parameter = undefined
            } else console.error("Cannot find parameter template by id", this.data.value.editData.parameter)
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