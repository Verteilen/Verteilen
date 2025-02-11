import { Record } from "./record"
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
}