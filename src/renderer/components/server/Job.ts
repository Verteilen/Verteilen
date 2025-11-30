import { v6 as uuidv6 } from 'uuid';
import { JobTable, Property, ProjectTable, TaskTable, DatabaseTable, Library, TaskBase, JobCategory } from "verteilen-core/src/interface"
import { ComputedRef, Ref } from "vue"
import { i18n } from "../../plugins/i18n"

export interface ViewTreeNode {
    id: string
    title: string
    children?: Array<ViewTreeNode>
}

export interface DATA {
    page: number
    createModal: boolean
    createType: JobCategory
    createData: JobTable
    editMode: boolean
    conditionModal: boolean
    deleteModal: boolean
    deleteData: Array<string>
    selection: Array<string>
    buffer: TaskBase | undefined
    types: Array<any>
    types2: Array<any>
    result: Array<any>
    categorise: Array<any>
    dirty: boolean
    pfields: Array<any>
    errorMessage: string
    titleError: boolean
}

export interface PROPS {
    projects: Array<ProjectTable>
    jobs: Array<JobTable>
    select: TaskTable | undefined
    owner: ProjectTable | undefined
    database: DatabaseTable | undefined
    libs: Array<Library>
}

export type EmitType = {
    (e: 'added', job:JobTable): void
    (e: 'save', job:JobTable): void
    (e: 'clone', job:JobTable): void
    (e: 'edit', job:JobTable): void
    (e: 'delete', uuids:Array<string>): void
    (e: 'select', uuids:string): void
    (e: 'keychange', key:string): void
    (e: 'moveup', uuids:string): void
    (e: 'movedown', uuids:string): void

    (e: 'padded'): void
    (e: 'pdelete', name:string): void
    (e: 'taskSubmit', data:TaskBase): void
    (e: 'return'): void
}

export class Util_Job {
    data: Ref<DATA>
    emits: EmitType
    properties: ComputedRef<Property[] | undefined>

    constructor(
        data: Ref<DATA>,
        emits: EmitType,
        properties: ComputedRef<Property[] | undefined>
    ){
        this.data = data
        this.emits = emits
        this.properties = properties
    }

    jobCreate = (job:JobTable):JobTable | undefined => {
        if(job.title.length == 0){
            this.data.value.errorMessage = i18n.global.t('error.title-needed')
            this.data.value.titleError = true
            return undefined
        }
        return {
            ...job,
            uuid: uuidv6()
        }
    }

    moveUp = (uuid:string) => {
        this.emits('moveup', uuid)
    }
    moveDown = (uuid:string) => {
        this.emits('movedown', uuid)
    }

    dirty = () => {
        this.data.value.dirty = true
    }
    save = () => {
        this.p_submit()
        this.data.value.dirty = false
    }
    move = (e:any, oge:any) => {
        //console.log("MOVE", e, oge)
    }
    end = (e:any) => {
        //const uuids = this.tasks.value.map(x => x.uuid)
        const n:number = e.newIndex
        const o:number = e.oldIndex
        //const buffer = uuids.splice(o, 1)
        //uuids.splice(n, 0, ...buffer)
        //this.emits('reorder', uuids)
    }

    pcreateProperty = () => {
        this.emits('padded')
    }
    p_submit = () => {
        if(this.data.value.buffer == undefined) return
        this.emits('taskSubmit', this.data.value.buffer)
    }
    pdelete = (name:string) => {
        if(this.data.value.buffer == undefined) return
        const index = this.data.value.buffer.properties.findIndex(x => x.name == name)
        if(index == -1) return
        this.data.value.buffer.properties.splice(index, 1)
        this.p_submit()
    }
    pmove = (e:any, oge:any) => {
        //console.log("MOVE", e, oge)
    }
    pend = (e:any) => {
        if(this.data.value.buffer == undefined) return
        const n:number = e.newIndex
        const o:number = e.oldIndex
        const buffer = this.data.value.buffer.properties.splice(o, 1)
        this.data.value.buffer.properties.splice(n, 0, ...buffer)
        this.p_submit()
    }
}