import { JobTable, Property, ProjectTable, TaskTable, DatabaseTable, Library, Job } from "verteilen-core/src/interface"
import { Ref } from "vue"

export interface DATA {
    ck: number,
    createModal: boolean
    createData: CreateData
    deleteModal: boolean
    deleteData: Array<string>
    items: Array<JobTable>
    items2: Array<Property>
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
    (e: 'edit', task:Array<JobTable>, properties: Array<Property>): void
    (e: 'delete', uuids:Array<string>): void
    (e: 'select', uuids:string): void
    (e: 'keychange', key:string): void
    (e: 'moveup', uuids:string): void
    (e: 'movedown', uuids:string): void
    (e: 'return'): void
}

export interface CreateData {
    category: number
    type: number
    spe_template: number
}

export class Util_Job {
    data: Ref<DATA>
    emits: EmitType

    constructor(
        data: Ref<DATA>,
        emits: EmitType
    ){
        this.data = data
        this.emits = emits
    }
}