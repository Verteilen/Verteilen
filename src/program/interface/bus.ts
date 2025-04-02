import { Job, Parameter, Project, Task } from "./base"
import { ExecutionLog, Log, Record } from "./record"
import { FeedBack, Header, Setter, ShellFolder, Single, WebsocketPack } from "./struct"
import { NodeTable } from "./table"
import { ToastData } from "./ui"

type Handler<T = unknown> = (event: T) => void
export type Messager = (msg:string, tag?:string) => void
export type Messager_log = (msg:string, tag?:string, meta?:string) => void

export interface BusAnalysis {
    name:string
    h:Header
    c:WebsocketPack | undefined
}

export interface Rename {
    oldname: string
    newname: string
}

export interface Login {
    username: string
    password: string
}

export interface RawSend {
    name: string
    token?: string
    data: any
}

export interface EmitterProxy<T> {
    on<Key extends keyof T> (type: T, handler: Handler<T[Key]>): void
    off<Key extends keyof T> (type: T, handler: Handler<T[Key]>): void
    emit<Key extends keyof T> (type: T, handler: T[Key]): void
}

export interface ExecuteProxy {
    executeProjectStart: (data:Project) => void
    executeProjectFinish: (data:Project) => void
    executeTaskStart: (data:[Task, number]) => void
    executeTaskFinish: (data:Task) => void
    executeSubtaskStart: (data:[Task, number, string]) => void
    executeSubtaskFinish: (data:[Task, number, string]) => void
    executeJobStart: (data:[Job, number, string]) => void
    executeJobFinish: (data:[Job, number, string, number]) => void
    feedbackMessage: (data:FeedBack) => void
    updateParameter: (data:Parameter) => void
    shellReply: (data:Single) => void
    folderReply: (data:ShellFolder) => void
}

/**
 * Emitter events container for Primary use
 */
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
    shellReply: Single
    folderReply: ShellFolder
    feedbackMessage: FeedBack

    renameScript: Rename
    deleteScript: string

    executeProjectStart: Project
    executeProjectFinish: Project
    /**
     * * 0.Task: Task instance
     * * 1.number: The amounts of subtask need
     */
    executeTaskStart: [Task, number]
    executeTaskFinish: Task
    /**
     * * 0.Task: Task instance
     * * 1.number: Subtask index
     * * 2.string: node uuid
     */
    executeSubtaskStart: [Task, number, string]
    /**
     * * 0.Task: Task instance
     * * 1.number: Subtask index
     * * 2.string: node uuid
     */
    executeSubtaskFinish: [Task, number, string]
    /**
     * * 0.Job: Job instance
     * * 1.number: Subtask index
     * * 2.string: node uuid
     */
    executeJobStart: [Job, number, string]
    /**
     * * 0.Job: Job instance
     * * 1.number: Subtask index
     * * 2.string: node uuid
     * * 3.string: meta string
     */
    executeJobFinish: [Job, number, string, number]
    updateRuntimeParameter: Parameter

    analysis: BusAnalysis
    debuglog: string
    isExpress: boolean

    delay: Setter
    system: Setter
}

/**
 * Emitter events container for Web client
 */
export type BusWebType = {
    raw_send: RawSend

    locate: string
    load_preference: string
    load_cookie: void
    get_token: string
}