import { DatabaseTable, Job, JobCategory, Library, TaskTable } from "verteilen-core/dist/interface";
import { PROPS as BasePROPS } from "../DialogBase.vue"

export interface PROPS extends BasePROPS {
    jobtype: JobCategory
    edit: boolean
    task?: TaskTable
    select: Job
    database?: DatabaseTable
    libs: Array<Library>
    result: Array<any>
    types: Array<any>
    types2: Array<any>
    errorMessage: string
    titleError: boolean
}

export interface DATA {
    ck: number
    zoom: boolean
    buffer: Job
}

export type EmitType = {
    (e: 'confirm', job:Job):void
}