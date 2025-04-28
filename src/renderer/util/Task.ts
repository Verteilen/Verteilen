import { v6 as uuidv6 } from 'uuid';
import { Ref } from "vue";
import { DataType, Project, Task, TaskTable } from "../interface";
import { i18n } from '../plugins/i18n';

type getselect = () => Project | undefined

export interface CreateField {
    title: string
    description: string
    setupjob: boolean
    cronjob: boolean
    cronjobKey: string
    multi: boolean
    multiKey: string
}

export interface DATA {
    fields: Array<any>
    paraModal:boolean
    dialogModal:boolean
    isEdit: boolean
    editData: CreateField
    editUUID: string
    deleteModal: boolean
    deleteData:Array<string>
    items:Array<TaskTable>
    para_keys:Array<string>
    errorMessage: string
    titleError: boolean
    search: string | undefined
    selectSearch: string | undefined
    selection:Array<string>
}

export interface DialogDATA {
    isEdit: boolean
    editData: CreateField
    errorMessage: string
    titleError: boolean
    para_keys:Array<string>
}

export class Util_Task {
    data:Ref<DATA>
    select:getselect

    public get select_props() : Project | undefined {
        return this.select()
    }

    constructor(_data:Ref<DATA>, _select:getselect){
        this.data = _data
        this.select = _select
    }

    updateTask = () => {
        const p = this.select_props
        this.data.value.items = p?.task.map(x => {
            return {
                s: false,
                ID: x.uuid,
                setupjob: x.setupjob,
                cronjob: x.cronjob,
                multi: x.multi,
                title: x.title,
                description: x.description,
                jobCount: x.jobs.length
            }
        }) ?? []
        const allid = this.data.value.items.map(x => x.ID)
        this.data.value.selection = this.data.value.selection.filter(x => allid.includes(x)) 
    }

    updateParameter = () => {
        const p = this.select_props
        this.data.value.para_keys = p?.parameter?.containers.filter(x => x.type == DataType.Number).map(x => x.name) ?? []
    }

    createProject = () => {
        this.data.value.editData = {cronjob: false, cronjobKey: this.data.value.para_keys[0], title: "", description: "", setupjob: false, multi: false, multiKey: this.data.value.para_keys[0]}
        this.data.value.dialogModal = true
        this.data.value.errorMessage = ''
        this.data.value.titleError = false
    }

    cloneSelect = () => {
        const p = this.select_props
        if(p == undefined) return undefined
        const selected_task_ids = this.data.value.items.filter(x => this.data.value.selection.includes(x.ID)).map(x => x.ID)
        const ts:Array<Task> = p.task.filter(x => selected_task_ids.includes(x.uuid)).map(y => JSON.parse(JSON.stringify(y)))
        ts.forEach(x => {
            x.uuid = uuidv6()
            x.title = x.title + ` (${i18n.global.t('clone')})`
            x.jobs.forEach(y => {
                y.uuid = uuidv6()
            })
        })
        return ts
    }

    confirmCreate = () => {
        if(this.data.value.editData.title.length == 0){
            this.data.value.errorMessage = i18n.global.t('error.title-needed')
            this.data.value.titleError = true
            return undefined
        }
        this.data.value.dialogModal = false
        return [{ 
            uuid: uuidv6(),
            title: this.data.value.editData.title, 
            description: this.data.value.editData.description,
            setupjob: this.data.value.editData.setupjob,
            cronjob: this.data.value.editData.cronjob,
            cronjobKey: this.data.value.editData.cronjobKey,
            multi: this.data.value.editData.multi, 
            multiKey: this.data.value.editData.multiKey,
            properties: [],
            jobs: []
        }]
    }

    confirmEdit = () => {
        if(this.data.value.editData.title.length == 0){
            this.data.value.errorMessage = i18n.global.t('error.title-needed')
            this.data.value.titleError = true
            return
        }
        const p = this.select_props
        if(p == undefined) return
        const selectp = p.task.find(x => x.uuid == this.data.value.editUUID)
        if(selectp == undefined) return undefined;
        this.data.value.dialogModal = false
        return { 
            uuid: this.data.value.editUUID,
            title: this.data.value.editData.title, 
            description: this.data.value.editData.description,
            setupjob: this.data.value.editData.setupjob,
            cronjob: this.data.value.editData.cronjob,
            cronjobKey: this.data.value.editData.cronjobKey,
            multi: this.data.value.editData.multi, 
            multiKey: this.data.value.editData.multiKey,
            properties: selectp.properties,
            jobs: selectp.jobs
        }
    }

    dataedit = (uuid:string) => {
        if(this.select() == undefined) return
        const selectp = this.select()!.task.find(x => x.uuid == uuid)
        if(selectp == undefined) return;
        this.data.value.editData = {
            setupjob: selectp.setupjob,
            cronjob: selectp.cronjob, 
            cronjobKey: selectp.cronjobKey, 
            title: selectp.title, 
            description: selectp.description, 
            multi: selectp.multi, 
            multiKey: selectp.multiKey
        };
        this.data.value.dialogModal = true;
        this.data.value.isEdit = true
        this.data.value.editUUID = uuid;
        this.data.value.errorMessage = ''
        this.data.value.titleError = false
    }

    isFirst = (uuid:string) => {
        if(this.select_props == undefined) return
        const index = this.select_props.task.findIndex(x => x.uuid == uuid)
        return index <= 0
    }
    
    isLast = (uuid:string) => {
        const p = this.select_props
        if(p == undefined) return
        const index = p.task.findIndex(x => x.uuid == uuid)
        if(index == -1) return true
        return index == p.task.length - 1
    }
}