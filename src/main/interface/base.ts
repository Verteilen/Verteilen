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
    category: number
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
    multi: boolean
    multiKey: string
    jobs: Array<Job>
}

export interface Project {
    uuid: string
    title: string
    description: string
    parameter: Parameter
    task: Array<Task>
}