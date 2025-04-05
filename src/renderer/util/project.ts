import { v6 as uuidv6 } from 'uuid';
import { AppConfig, Ref } from "vue";
import { Project, ProjectTable } from "../interface";
import { i18n } from '../plugins/i18n';
import { GetAfterEffectTemplate, GetBlenderTemplate, GetDefaultProjectTemplate, GetFFmpeg_Image2VideoProjectTemplate, GetFUNIQUE_GS4ProjectTemplate, GetFUNIQUE_GS4Project_V2_Template } from "../template/projectTemplate";

type getproject = () => Array<Project>

export interface CreateField {
    title: string
    description: string
    useTemp: boolean
    temp: number
}

export interface Temp {
    text: string
    value: number
}

export interface PROPS {
    projects: Array<Project>
    config: AppConfig
}

export interface INPUT {
    items:Ref<Array<ProjectTable>>
    createModal:Ref<boolean>
    createData:Ref<CreateField>
    temps:Ref<Array<Temp>>
    editModal:Ref<boolean>
    editUUID:Ref<string>
    deleteModal:Ref<boolean>
    deleteData:Ref<Array<string>>
    errorMessage:Ref<string>
    titleError:Ref<boolean>
}

type callbackFunc = (input:Project)=>Project
const projectTemp:{ [key:number]:callbackFunc } = {
    0: GetDefaultProjectTemplate,
    1: GetFUNIQUE_GS4ProjectTemplate,
    2: GetFUNIQUE_GS4Project_V2_Template,
    3: GetFFmpeg_Image2VideoProjectTemplate,
    4: GetBlenderTemplate,
    5: GetAfterEffectTemplate
}

export class Util_Project {
    getproject:getproject
    data:INPUT
    
    public get projects() : Array<Project> {
        return this.getproject()
    }

    constructor(_data:INPUT, _getproject:getproject){
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

    createProject = () => {
        this.data.createData.value = {title: "", description: "", useTemp: false, temp: 0};
        this.data.createModal.value = true
        this.data.errorMessage.value = ''
        this.data.titleError.value = false
    }

    confirmCreate = () => {
        if(this.data.createData.value.title.length == 0){
            this.data.errorMessage.value = i18n.global.t('error.title-needed')
            this.data.titleError.value = true
            return
        }
        this.data.createModal.value = false
        let buffer:Project = { 
            uuid: uuidv6(),
            title: this.data.createData.value.title, 
            description: this.data.createData.value.description,
            parameter: {
                canWrite: true,
                containers: []
            },
            task: []
        }
        if (this.data.createData.value.useTemp){
            buffer = projectTemp[this.data.createData.value.temp](buffer)
        }
        return buffer
    }

    confirmEdit = () => {
        if(this.data.createData.value.title.length == 0){
            this.data.errorMessage.value = i18n.global.t('error.title-needed')
            this.data.titleError.value = true
            return
        }
        const selectp = this.projects.find(x => x.uuid == this.data.editUUID.value)
        return selectp
    }
}