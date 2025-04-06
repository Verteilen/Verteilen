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

export interface DATA {
    items:Array<ProjectTable>
    fields: Array<any>
    createModal:boolean
    createData:CreateField
    temps:Array<Temp>
    editModal:boolean
    editUUID:string
    deleteModal:boolean
    deleteData:Array<string>
    errorMessage:string
    titleError:boolean
    search:string
    selection:Array<string>
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
        const selectp = this.projects.find(x => x.uuid == uuid)
        if(selectp == undefined) return;
        this.data.value.createData = {title: selectp.title, description: selectp.description, useTemp: false, temp: 0};
        this.data.value.editModal = true;
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
        this.data.value.createData = {title: "", description: "", useTemp: false, temp: 0};
        this.data.value.createModal = true
        this.data.value.errorMessage = ''
        this.data.value.titleError = false
    }

    confirmCreate = () => {
        if(this.data.value.createData.title.length == 0){
            this.data.value.errorMessage = i18n.global.t('error.title-needed')
            this.data.value.titleError = true
            return
        }
        this.data.value.createModal = false
        let buffer:Project = { 
            uuid: uuidv6(),
            title: this.data.value.createData.title, 
            description: this.data.value.createData.description,
            parameter: {
                canWrite: true,
                containers: []
            },
            task: []
        }
        if (this.data.value.createData.useTemp){
            buffer = projectTemp[this.data.value.createData.temp](buffer)
        }
        return buffer
    }

    confirmEdit = () => {
        if(this.data.value.createData.title.length == 0){
            this.data.value.errorMessage = i18n.global.t('error.title-needed')
            this.data.value.titleError = true
            return undefined
        }
        const selectp = this.projects.find(x => x.uuid == this.data.value.editUUID)
        return selectp
    }
}