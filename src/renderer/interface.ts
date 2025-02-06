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
}

export interface Job {
    uuid: string
    type: JobType
}

export interface Task {
    uuid: string
    title: string
    description: string
    cronjob: boolean
    jobs: Array<Job>
}

export interface Project {
    uuid: string
    title: string
    description: string
    task: Array<Task>
}

export interface NodeTable {
    s: boolean
    ID: string
    url: string
    connection_rate: number
}

export interface JobTable {
    s: boolean
    ID: string
    type: JobType
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
}