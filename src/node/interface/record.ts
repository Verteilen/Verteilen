import { Node, Project } from "./base"
import { ExecuteState } from "./enum"
import { WebsocketPack } from "./struct"

export interface ExecuteData {
    uuid: string
    state: ExecuteState
}

export interface ExecutionTaskLog {
    project_state: Array<ExecuteData>
    task_state: ExecuteData
    task_detail: Array<ExecuteRecordTask>
}

export interface ExecutionLog {
    prject: Project
    state: ExecuteState
    logs: Array<ExecutionTaskLog>
}

export interface ExecuteRecordTask {
    index: number
    node: string
    message: Array<string>
    state: ExecuteState
}

export interface Log {
    logs: Array<ExecutionLog>
}

export interface Record {
    projects: Array<Project>
    nodes: Array<Node>
}

export interface ExecutePack {
    projects: Array<Project>
    nodes: Array<WebsocketPack>
}

export interface Library {
    name: string
    content: string
}

export interface Libraries {
    libs: Array<Library>
}