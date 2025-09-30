// ========================
//                           
//      Share Codebase     
//                           
// ========================
import { Job, Parameter, Project, Task } from "./base"
import { ExecuteState } from "./enum"
import { ExecutionLog, Log, Preference } from "./record"
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

/**
 * The middleware for task scheduler worker with singal sender
 */
export interface ExecuteProxy {
    executeProjectStart: (data:[Project, number]) => void
    executeProjectFinish: (data:[Project, number]) => void
    /**
     * * 0.Task: Task instance
     * * 1.number: The amounts of subtask need
     */
    executeTaskStart: (data:[Task, number]) => void
    executeTaskFinish: (data:Task) => void
    /**
     * * 0.Task: Task instance
     * * 1.number: Subtask index
     * * 2.string: node uuid
     */
    executeSubtaskStart: (data:[Task, number, string]) => void
    executeSubtaskUpdate: (data:[Task, number, string, ExecuteState]) => void
    /**
     * * 0.Task: Task instance
     * * 1.number: Subtask index
     * * 2.string: node uuid
     */
    executeSubtaskFinish: (data:[Task, number, string]) => void
    /**
     * * 0.Job: Job instance
     * * 1.number: Subtask index
     * * 2.string: node uuid
     */
    executeJobStart: (data:[Job, number, string]) => void
    /**
     * * 0.Job: Job instance
     * * 1.number: Subtask index
     * * 2.string: node uuid
     * * 3.string: meta string
     */
    executeJobFinish: (data:[Job, number, string, number]) => void
    feedbackMessage: (data:FeedBack) => void
    updateParameter: (data:Parameter) => void
}

export interface NodeProxy { 
    shellReply: (data:Single, w?:WebsocketPack) => void
    folderReply: (data:ShellFolder, w?:WebsocketPack) => void
}

/**
 * Emitter events container for Primary use
 */
export type BusType = {
    setting: void
    guide: void
    makeToast: ToastData
    modeSelect: boolean
    createProject: void
    updateProject: void
    recoverProject: Project
    recoverParameter: Parameter
    relogin: void
    loginGuest: void
    login: Setter
    updateTask: void
    updateJob: void
    updateParameter: void
    selectParameter: string
    updateLocate: void
    updateNode: Array<NodeTable>
    updateCurrent: ExecutionLog,
    updateLog: Log
    updateHandle: void
    slowUpdateHandle: void
    shellReply: Single
    folderReply: ShellFolder
    feedbackMessage: FeedBack
    savePreference: Preference

    renameScript: Rename
    deleteScript: string

    analysis: BusAnalysis
    debuglog: string
    hotkey: string
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