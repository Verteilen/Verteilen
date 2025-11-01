import { JobTable, Property, ProjectTable, TaskTable, DatabaseTable, Library, Job, TaskBase, JobCategory } from "verteilen-core/src/interface"
import { ComputedRef, Ref } from "vue"

export interface ViewTreeNode {
    id: string
    title: string
    children?: Array<ViewTreeNode>
}

export interface DATA {
    ck: number
    page: number
    createModal: boolean
    createType: JobCategory
    createData: Job
    editMode: boolean
    deleteModal: boolean
    deleteData: Array<string>
    selection: Array<string>
    buffer: TaskBase | undefined
    types: Array<any>
    types2: Array<any>
    result: Array<any>
    categorise: Array<any>
    dirty: boolean
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
    (e: 'added', job:Job[]): void
    (e: 'clone', job:Job[]): void
    (e: 'edit', task:Array<JobTable>, properties: Array<Property>): void
    (e: 'delete', uuids:Array<string>): void
    (e: 'select', uuids:string): void
    (e: 'keychange', key:string): void
    (e: 'moveup', uuids:string): void
    (e: 'movedown', uuids:string): void

    (e: 'padded'): void
    (e: 'pdelete', name:string): void
    (e: 'pmoveup', index:number): void
    (e: 'pmovedown', index:number): void
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

    moveUp = (uuid:string) => {
        this.emits('moveup', uuid)
    }
    moveDown = (uuid:string) => {
        this.emits('movedown', uuid)
    }


    pcreateProperty = () => {
        this.emits('padded')
    }
    pmoveUp = (index:number) => {
        this.emits('pmoveup', index)
    }
    pmoveDown = (index:number) => {
        this.emits('pmovedown', index)
    }
    pdelete = (name:string) => {

    }

    /**
     * Check select task uuid is first in order
     * @param uuid Task UUID
     */
    pisFirst = (index:number):boolean => {
        return index == 0
    }
    /**
     * Check select task uuid is last in order
     * @param uuid Task UUID
     */
    pisLast = (index: number):boolean => {
        if(this.properties.value == undefined) return false
        return this.properties.value.length - 1 == index
    }
}