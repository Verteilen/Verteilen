import { ExecutionLog, Record } from "./record"
import { Header, Setter, WebsocketPack } from "./struct"
import { NodeTable } from "./table"
import { ToastData } from "./ui"

export type BusType = {
    makeToast: ToastData
    modeSelect: boolean
    createProject: void
    updateProject: void
    updateTask: void
    updateJob: void
    updateParameter: void
    updateNode: Array<NodeTable>
    execute: Record
    updateCurrent: ExecutionLog,
    updateLog: ExecutionLog
    updateHandle: void
    feedbackMessage: Setter

    executeProjectStart: string
    executeProjectFinish: string
    executeTaskStart: { uuid:string, count:number }
    executeTaskFinish: string
    executeSubtaskStart: { index:number, node:string }
    executeSubtaskFinish: { index:number, node:string }
    executeJobStart: { uuid:string, index:number, node:string }
    executeJobFinish: { uuid:string, index:number, node:string }

    analysis: { name:string, h:Header, c:WebsocketPack | undefined }
}