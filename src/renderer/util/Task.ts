import { TaskTable } from "../interface"

export interface CreateField {
    title: string
    description: string
    cronjob: boolean
    cronjobKey: string
    multi: boolean
    multiKey: string
}

export interface DATA {
    fields: Array<any>
    dialogModal:boolean
    isEdit: boolean
    createData: CreateField
    editUUID: string
    deleteModal: boolean
    deleteData:Array<string>
    items:Array<TaskTable>
    para_keys:Array<string>
    errorMessage: string
    titleError: boolean
    search: string,
    selection:Array<string>
}