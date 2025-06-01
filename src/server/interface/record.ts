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
    uuid: string
    dirty?: boolean
    output?: boolean
    filename: string
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
    /**
     * The speicifed the process step type
     * * 0: All Projects through
     * * 1: Single project through
     * * 2: SIngle task through
     */
    process_type: number
    para: Parameter | undefined
    command: Array<Array<any>>
    project: string
    useCron: boolean
    task: string
    project_index: number
    task_index: number
    project_state: Array<ExecuteData>
    task_state: Array<ExecuteData>
    task_detail: Array<ExecuteRecordTask>
}

export interface Preference {
    /**
     * Language setting
     */
    lan: string
    notification: boolean

    theme: string
    font: number
    
    /**
     * You can turn off the logging\
     * To prevent IO works to slowdown your works\
     * ![NOTICE] there will be no log to recover your works
     */
    log: boolean
}

export interface Library {
    name: string
    load: boolean
    content: string
}

export interface Libraries {
    libs: Array<Library>
}

export interface FileState {
    name: string,
    size: number
    time: Date
}
