import { v6 as uuidv6 } from 'uuid';
import { ComputedRef, Ref } from "vue";
import { Database, DatabaseTable, PluginPageData, Preference, ProjectTable } from "verteilen-core/dist/interface";
import { i18n } from '../../plugins/i18n';
import { BackendProxy } from '../../proxy';

/**
 * **Project Dialog Buffer**
 */
export interface CreateField {
    title: string
    description?: string
    useTemp: boolean
    usePara: boolean
    genPara: boolean
    database: string | null
    database_title: string | null
    temp: string | null
}
/**
 * **Create Dialog Data**
 */
export interface DialogDATA {
    isEdit: boolean
    databases: Array<Database>
    editData: CreateField
    errorMessage: string
    titleError: boolean
    plugin: PluginPageData
    preference?: Preference
}
/**
 * **Page Properties**
 */
export interface PROPS {
    projects: Array<ProjectTable>
    databases: Array<Database>
    plugin: PluginPageData
}
/**
 * **Page Emit Type**
 */
export type EmitType = {
    (e: 'added', project:ProjectTable[]): void
    (e: 'clone', uuid:string[]): void
    (e: 'edit', uuid:string, project:ProjectTable): void
    (e: 'delete', uuids:Array<string>, bind:boolean): void
    (e: 'select', uuids:string): void
}
/**
 * **Page Data**
 */
export interface DATA {
    itemPrePage: number
    fields: Array<any>
    dialogModal:boolean
    importModal:boolean
    importData: File[]
    isEdit: boolean
    editData:CreateField
    editUUID:string
    deleteModal:boolean
    deleteBind: boolean
    deleteData:Array<string>
    errorMessage:string
    titleError:boolean
    search:string
    selection:Array<string>
    sort: string | undefined
    order: string | undefined
}

export class Util_Project {
    data:Ref<DATA>
    backend: Ref<BackendProxy>
    emits: EmitType
    plugin: ComputedRef<PluginPageData>
    projects: ComputedRef<Array<ProjectTable>>
    databases: ComputedRef<Array<DatabaseTable>>
    selected_project_ids: ComputedRef<string[]>

    constructor(
        data:Ref<DATA>, 
        backend: Ref<BackendProxy>, 
        emits: EmitType,
        plugin: ComputedRef<PluginPageData>, 
        projects: ComputedRef<Array<ProjectTable>>, 
        databases: ComputedRef<Array<DatabaseTable>>,
        selected_project_ids: ComputedRef<string[]>)
    {
        this.data = data
        this.backend = backend
        this.emits = emits
        this.plugin = plugin
        this.projects = projects
        this.databases = databases
        this.selected_project_ids = selected_project_ids
    }

    
    //#region Event
    /**
     * **Edit UI Button Event Trigger**\
     * Open edit dialog
     * @param uuid Target Project UUID
     */
    dataEdit = (uuid:string):void => {
        this.data.value.isEdit = true
        const selectp = this.projects.value.find(x => x.uuid == uuid)
        if(selectp == undefined) return;
        this.data.value.editData = {title: selectp.title, usePara: false, description: selectp.description, genPara: false, useTemp: false, temp: null, database: null, database_title: null}
        this.data.value.dialogModal = true;
        this.data.value.editUUID = uuid;
        this.data.value.errorMessage = ''
        this.data.value.titleError = false
    }
    /**
     * Select project and get to see task detail
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
        this.data.value.isEdit = false
        this.data.value.editData = {title: "", description: "", useTemp: false, genPara: false, usePara: false, temp: null, database: null, database_title: null}
        this.data.value.dialogModal = true
        this.data.value.errorMessage = ''
        this.data.value.titleError = false
    }
    /**
     * **Clone Select Project**
     */
    cloneSelect = () => {
        this.emits('clone', this.selected_project_ids.value)
    }
    /**
     * **Create the project instance**\
     * This structure includes the task instance\
     * Except for database, it will use uuid as link
     * @requires data.editData.title not empty
     * @returns Whole project structure with task and job tree
     */
    confirmCreate = async (): Promise<ProjectTable | undefined> => {
        if(this.data.value.editData.title.length == 0){
            this.data.value.errorMessage = i18n.global.t('error.title-needed')
            this.data.value.titleError = true
            return undefined
        }
        this.data.value.dialogModal = false
        let buffer:ProjectTable = { 
            uuid: uuidv6(),
            title: this.data.value.editData.title, 
            description: this.data.value.editData.description,
            database_uuid: this.data.value.editData.database ?? '',
            database: undefined,
            // Submit task later
            tasks: [],
            tasks_uuid: [],
            taskCount: 0,
        }
        if (this.data.value.editData.useTemp){ // Referencing template data
            const select:string = this.data.value.editData.temp as string
            const tempSelect:Array<string> = select.split('/')
            if(tempSelect.length == 2){
                for(let x of this.plugin.value.plugins){
                    const p_temp = x.projects.find(y => y.group == tempSelect[0] && y.filename == tempSelect[1])
                    if(p_temp != undefined){
                        const templateData = await this.backend.value.invoke('get_project', x.title, p_temp.group, p_temp.filename + ".json")
                        const p:any = JSON.parse(templateData)
                        buffer = Object.assign(buffer, { tasks: p.tasks, database: p.database })

                        if(this.data.value.editData.genPara && buffer.database != undefined){
                            buffer.database.title = (this.data.value.editData.database_title && this.data.value.editData.database_title.length > 0) ? 
                            this.data.value.editData.database_title : buffer.title
                        }else{
                            buffer.database = undefined
                            buffer.database_uuid = ""
                        }

                        break
                    }
                }
            }            
        }
        if(this.data.value.editData.usePara){ // Referencing database
            const target = this.databases.value.find(x => x.uuid == this.data.value.editData.database)
            if(target != undefined){
                buffer.database_uuid = target.uuid
                buffer.database = undefined
            } else console.error("Cannot find database template by id", this.data.value.editData.database)
        }
        // Update all uuid in the tree
        buffer.tasks.forEach(x => {
            x.uuid = uuidv6()
            x.jobs.forEach(y => {
                y.uuid = uuidv6()
            })
        })
        return buffer
    }
    /**
     * **Edit Header Data**
     * Normally just title, description or acl, permission
     * @returns Select modified instance
     */
    confirmEdit = () => {
        if(this.data.value.editData.title.length == 0){
            this.data.value.errorMessage = i18n.global.t('error.title-needed')
            this.data.value.titleError = true
            return undefined
        }
        const selectp = this.projects.value.find(x => x.uuid == this.data.value.editUUID)
        return selectp
    }
    //#endregion

    //#region Getter
    /**
     * Check select project uuid is first in order
     * @param uuid Project UUID
     */
    isFirst = (uuid:string):boolean => {
        const index = this.projects.value.findIndex(x => x.uuid == uuid)
        return index <= 0
    }
    /**
     * Check select project uuid is last in order
     * @param uuid Project UUID
     */
    isLast = (uuid:string):boolean => {
        const index = this.projects.value.findIndex(x => x.uuid == uuid)
        if(index == -1) return true
        return index == this.projects.value.length - 1
    }
    isSort = ():boolean => {
        return this.data.value.order != undefined && this.data.value.sort != undefined
    }
    //#endregion
}