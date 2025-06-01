import { DataType } from "./enum"
import { LocalPermiision } from "./struct"

export interface ParameterContainer {
    s?: boolean
    name: string
    meta?:string
    type: DataType
    hidden: boolean
    runtimeOnly: boolean
    value: any
}

export interface Property {
    name: string
    expression: string
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
    uuid: string
    title: string
    description: string
    parameter_uuid: string
    parameter?: Parameter
    task: Array<Task>
}

export interface Node {
    permission?: LocalPermiision
    ID: string
    url: string
}