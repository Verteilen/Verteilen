import { WebSocket } from "ws"

export const PORT = 12080

export interface WebsocketPack {
    uuid: string
    websocket: WebSocket
}

export interface Header {
    name: string
    meta: string
    message: string
    data: any
}

export interface OnePath {
    path: string
}

export interface TwoPath {
    from: string
    to: string
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

export interface Record {
    projects: Array<Project>
}