import { Project } from "./base"
import { ExecutionLog, Log, Record } from "./record"
import { Header, Setter, WebsocketPack } from "./struct"
import { NodeTable } from "./table"
import { ToastData } from "./ui"

export interface BusProjectStart {
    uuid: string
}

export interface BusProjectFinish {
    uuid: string
}

export interface BusTaskStart {
    uuid:string
    count:number
}

export interface BusTaskFinish {
    uuid:string
}

export interface BusSubTaskStart {
    index:number
    node:string
}

export interface BusSubTaskFinish {
    index:number
    node:string
}

export interface BusJobStart {
    uuid:string
    /**
     * Cron Index\
     * If single, this value will be 0
     */
    index:number
    node:string
}

export interface BusJobFinish {
    /**
     * Job uuid
     */
    uuid:string
    /**
     * Cron Index\
     * If single, this value will be 0
     */
    index:number
    /**
     * Use node uuid
     */
    node:string
    /**
     * 0: Success\
     * 1: Failed
     */
    meta:number
}

export interface BusAnalysis {
    name:string
    h:Header
    c:WebsocketPack | undefined
}

export interface Rename {
    oldname: string
    newname: string
}

export type BusType = {
    makeToast: ToastData
    modeSelect: boolean
    createProject: void
    updateProject: void
    recoverProject: Project
    updateTask: void
    updateJob: void
    updateParameter: void
    updateLocate: void
    updateNode: Array<NodeTable>
    execute: Record
    updateCurrent: ExecutionLog,
    updateLog: Log
    updateHandle: void
    feedbackMessage: Setter

    renameScript: Rename
    deleteScript: string

    executeProjectStart: BusProjectStart
    executeProjectFinish: BusProjectFinish
    executeTaskStart: BusTaskStart
    executeTaskFinish: BusTaskFinish
    executeSubtaskStart: BusSubTaskStart
    executeSubtaskFinish: BusSubTaskFinish
    executeJobStart: BusJobStart
    executeJobFinish: BusJobFinish

    analysis: BusAnalysis
    debuglog: string
}

export type BusWebType = {
    locate: string
    load_preference: string
    load_preference_call: void
}