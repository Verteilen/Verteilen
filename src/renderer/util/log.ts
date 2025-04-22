import { Log } from "../interface"


export interface DATA {
    tag: number
    recoverDialog: boolean
    exportDialog: boolean
    logs: Log
    task_index: number
    leftSize: number
    rightSize: number
    totalLength: number
    current: number
    selection: number
    panelValue: Array<number>
}