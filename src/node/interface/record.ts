import { Node, Parameter, Project } from "./base"
import { ExecuteState } from "./enum"

export interface ExecuteData {
    uuid: string
    state: ExecuteState
}

export interface ExecutionTaskLog {
    task_state: ExecuteData
    start_timer: number
    end_timer: number
    task_detail: Array<ExecuteRecordTask>
}

export interface ExecutionLog {
    project: Project
    parameter: Parameter
    start_timer: number
    end_timer: number
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

export interface ExecuteRecord extends Record {
    running: boolean
    stop: boolean
    project: string
    task: string
    project_index: number
    task_index: number
    project_state: Array<ExecuteData>
    task_state: Array<ExecuteData>
    task_detail: Array<ExecuteRecordTask>
}

export interface Preference {
    lan: string
    log: boolean
}

export interface Library {
    name: string
    content: string
}

export interface Libraries {
    libs: Array<Library>
}
