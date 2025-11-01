import { v6 as uuidv6 } from 'uuid';
import { ComputedRef, Ref } from "vue";
import { DatabaseTable, DataType, Preference, Project, ProjectTable, Task, TaskTable } from "../../interface";
import { i18n } from '../../plugins/i18n';

/**
 * **Task Dialog Buffer**
 */
export interface CreateField {
    title: string
    description: string
    setupjob: boolean
    cronjob: boolean
    cronjobKey: string
    multi: boolean
    multiKey: string
}
/**
 * **Create Dialog Data**
 */
export interface DialogDATA {
    isEdit: boolean
    editData: CreateField
    errorMessage: string
    titleError: boolean
    para_keys:Array<{ title:string, subtitle: string, value: string }>
    preference?: Preference
}
/**
 * **Page Properties**
 */
export interface PROPS {
    projects: Array<ProjectTable>
    tasks: Array<TaskTable>
    select: ProjectTable | undefined
    databases: Array<DatabaseTable>
}
/**
 * **Page Emit Type**
 */
export type EmitType = {
    (e: 'added', task:TaskTable[]): void
    (e: 'clone', uuid:string[]): void
    (e: 'edit', uuid:string, task:TaskTable): void
    (e: 'delete', uuids:Array<string>): void
    (e: 'select', uuids:string): void
    (e: 'database', uuid:string):void
    (e: 'bind', uuid:string):void
    (e: 'moveup', uuids:string): void
    (e: 'movedown', uuids:string): void
    (e: 'return'): void
}
/**
 * **Page Data**
 */
export interface DATA {
    fields: Array<any>
    itemPrePage: number
    paraModal:boolean
    dialogModal:boolean
    isEdit: boolean
    editData: CreateField
    editUUID: string
    deleteModal: boolean
    deleteData:Array<string>
    errorMessage: string
    titleError: boolean
    search: string | undefined
    selectSearch: string | undefined
    selection:Array<string>
    sort: string | undefined
    order: string | undefined
}

export class Util_Task {
    data:Ref<DATA>
    emits:EmitType
    select:ComputedRef<ProjectTable | undefined>
    tasks: ComputedRef<Array<TaskTable>>
    selected_task_ids: ComputedRef<string[]>

    constructor(
        data:Ref<DATA>, 
        emits:EmitType,
        select:ComputedRef<ProjectTable | undefined>,
        tasks: ComputedRef<Array<TaskTable>>,
        selected_task_ids: ComputedRef<string[]>
    ){
        this.data = data
        this.emits = emits
        this.select = select
        this.tasks = tasks
        this.selected_task_ids = selected_task_ids
    }

    //#region Event
    moveUp = (uuid:string) => {
        this.emits('moveup', uuid)
    }
    moveDown = (uuid:string) => {
        this.emits('movedown', uuid)
    }
    dataEdit = (uuid:string) => {
        if(this.select.value == undefined) return
        const selectp = this.tasks.value.find(x => x.uuid == uuid)
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
    /**
     * Select task and get to see job detail
     * @param uuid 
     */
    dataChoose = (uuid:string):void => {
        this.emits('select', uuid)
    }
    /**
     * **Create UI Button Event Trigger**\
     * Open create dialog
     */
    createProject = () => {
        this.data.value.editData = {cronjob: false, cronjobKey: '', title: "", description: "", setupjob: false, multi: false, multiKey: ''}
        this.data.value.dialogModal = true
        this.data.value.errorMessage = ''
        this.data.value.titleError = false
    }

    cloneSelect = () => {
        this.emits('clone', this.selected_task_ids.value)
        this.data.value.selection = []
    }

    confirmCreate = ():Array<TaskTable> | undefined => {
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
            jobs: [],
            jobs_uuid: [],
            jobCount: 0,
        }]
    }

    confirmEdit = ():TaskTable | undefined => {
        if(this.data.value.editData.title.length == 0){
            this.data.value.errorMessage = i18n.global.t('error.title-needed')
            this.data.value.titleError = true
            return undefined
        }
        const p = this.select.value
        if(p == undefined) return
        const selectp = p.tasks.find(x => x.uuid == this.data.value.editUUID)
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
            jobs: selectp.jobs,
            jobs_uuid: selectp.jobs_uuid,
            jobCount: selectp.jobs_uuid.length,
        }
    }
    //#endregion

    //#region Getter
    /**
     * Check select task uuid is first in order
     * @param uuid Task UUID
     */
    isFirst = (uuid:string):boolean => {
        if(this.select.value == undefined) return false
        const index = this.select.value?.tasks_uuid.findIndex(x => x == uuid)
        return index <= 0
    }
    /**
     * Check select task uuid is last in order
     * @param uuid Task UUID
     */
    isLast = (uuid:string):boolean => {
        if(this.select.value == undefined) return false
        const index = this.select.value?.tasks_uuid.findIndex(x => x == uuid)
        if(index == -1) return true
        return index == this.select.value?.tasks_uuid.length - 1
    }
    isSort = ():boolean => {
        return this.data.value.order != undefined && this.data.value.sort != undefined
    }
    //#endregion
}