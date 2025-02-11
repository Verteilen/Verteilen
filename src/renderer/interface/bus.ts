import { ExecutionLog, Record } from "./record"
import { ToastData } from "./ui"

export type BusType = {
    makeToast: ToastData
    modeSelect: boolean
    createProject: void
    updateProject: void
    updateTask: void
    updateJob: void
    updateParameter: void
    execute: Record
    updateCurrent: ExecutionLog,
    updateLog: ExecutionLog
    updateHandle: void
}