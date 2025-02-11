import { Node, Project } from "./base"
import { ExecuteState } from "./enum"

export interface ExecutionProcess {
    projects: Array<Project>
}

export interface ExecutionLog {
    project_state: Array<ExecuteData>
    task_state: Array<ExecuteData>
    task_detail: Array<ExecuteRecordTask>
}

export interface ExecuteRecordTask {
    index: number
    node: string
    message: Array<string>
    state: ExecuteState
}

export interface ExecuteData {
    uuid: string
    state: ExecuteState
}

export interface Record {
    projects: Array<Project>
    nodes: Array<Node>
    current?: ExecutionLog
    logs?: ExecutionLog
}

export interface ExecuteRecord extends Record {
    running: boolean
    project: string
    task: string
    project_index: number
    task_index: number
    project_state: Array<ExecuteData>
    task_state: Array<ExecuteData>
    task_detail: Array<ExecuteRecordTask>
}