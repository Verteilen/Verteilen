// ========================
//                           
//      Share Codebase     
//                           
// ========================
import { DataType, DataTypeBase } from "./enum"
import { ACLType, LocalPermiision } from "./server"

export interface ParameterConfigTrigger {
    types: Array<DataTypeBase>
}

export interface ParameterContainer {
    s?: boolean
    name: string
    meta?: any
    config?: ParameterConfigTrigger
    type: DataType
    hidden: boolean
    runtimeOnly: boolean
    value: any
}

export interface Property {
    name: string
    expression: string
    deep?: number
}

export interface Parameter {
    uuid: string
    title: string
    canWrite: boolean
    containers: Array<ParameterContainer>
}

export interface Job {
    s?: boolean
    permission?: LocalPermiision
    index?:number
    uuid: string
    runtime_uuid?: string
    category: number
    type: number
    script: string
    string_args: Array<string>
    number_args: Array<number>
    boolean_args: Array<boolean>
}

export interface Task {
    permission?: LocalPermiision
    uuid: string
    title: string
    description: string
    setupjob: boolean
    cronjob: boolean
    cronjobKey: string
    multi: boolean
    multiKey: string
    properties: Array<Property>
    jobs: Array<Job>
}

export interface Project {
    permission?: LocalPermiision
    acl?: ACLType
    owner?: string
    uuid: string
    title: string
    description: string
    parameter_uuid: string
    parameter?: Parameter
    task: Array<Task>
}

export interface Node {
    permission?: LocalPermiision
    acl?: ACLType
    ID: string
    url: string
}