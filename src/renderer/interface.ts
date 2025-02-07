export interface IMessage {
    ison: boolean,
    timer: number,
    variant: any,
    title: string,
    content: string
}

export interface ToastData {
    title: string,
    type: string,
    message: string
}

export enum JobType {
    COPY_FILE,
    COPY_DIR,
    DELETE_FILE,
    DELETE_DIR,
    LUA,
    COMMAND
}

export enum LUATemplate {
    DEFAULT,
    FUNIQUE_GS4_V1
}

export const JobTypeText: { [key:number]:string } = {
    0: '複製檔案',
    1: '複製資料夾',
    2: '刪除檔案',
    3: '刪除資料夾',
    4: 'LUA 腳本',
    5: '指令執行'
}

export const LUATemplateText: { [key:number]:string } = {
    0: '預設',
    1: '睿智 GS4 資料夾整理 v1'
}

export interface Parameter {
    numbers: Array<{ name: string, value: number }>
    strings: Array<{ name: string, value: string }>
    booleans: Array<{ name: string, value: boolean }>
}

export interface Job {
    uuid: string
    type: number
    lua: string
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

export interface NodeTable {
    s: boolean
    ID: string
    url: string
    connection_rate: number
}

export interface TaskTable {
    s: boolean
    ID: string
    cronjob: boolean
    title: string
    description: string
    jobCount: number
}

export interface ProjectTable {
    s: boolean
    ID: string
    title: string
    description: string
    taskCount: number
}

export interface Record {
    projects: Array<Project>
}

export type BusType = {
    makeToast: ToastData
    modeSelect: boolean
    createProject: void
    updateProject: void
    updateTask: void
    updateJob: void
    updateParameter: void
}