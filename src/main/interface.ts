import { WebSocket } from "ws"

export const PORT = 12080

export enum ExecuteState {
    STOP,
    RUNNING,
    Finish
}

export interface WebsocketPack {
    uuid: string
    websocket: WebSocket
}

export interface Header {
    name: string
    meta?: string
    message?: string
    data?: any
}

export interface Single {
    data: any
}

export interface OnePath {
    path: string
}

export interface TwoPath {
    from: string
    to: string
}

export interface Setter {
    key: string
    value: any
}

export interface FeedBack {
    job_uuid: string
    message: string
}

export enum JobType {
    COPY_FILE,
    COPY_DIR,
    DELETE_FILE,
    DELETE_DIR,
    CREATE_FILE,
    CREATE_DIR,
    RENAME,
    LUA,
    COMMAND
}

export const JobTypeText: { [key:number]:string } = {
    0: '複製檔案',
    1: '複製資料夾',
    2: '刪除檔案',
    3: '刪除資料夾',
    4: '建立檔案',
    5: '建立資料夾',
    6: '改名',
    7: 'LUA 腳本',
    8: '指令執行'
}

export interface Parameter {
    numbers: Array<{ name: string, value: number }>
    strings: Array<{ name: string, value: string }>
    booleans: Array<{ name: string, value: boolean }>
}

export interface Node {
    ID: string
    url: string
}

export interface Job {
    uuid: string
    type: number
    lua: string
    index?: number
    string_args: Array<string>
    number_args: Array<number>
    boolean_args: Array<boolean>
}

export interface Task {
    uuid: string
    title: string
    description: string
    cronjob: boolean
    cronjobKey: string
    jobs: Array<Job>
}

export interface Project {
    uuid: string
    title: string
    description: string
    parameter: Parameter
    task: Array<Task>
}

export interface Record {
    projects: Array<Project>
    nodes: Array<Node>
}

export interface ExecutePack {
    projects: Array<Project>
    nodes: Array<WebsocketPack>
}

export interface WebsocketPackState extends WebsocketPack {
    current_job: string
    state: ExecuteState
}

export interface KeyValue {
    key: any
    value: any
}