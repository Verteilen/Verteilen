import { Node } from './base'
import { SystemLoad } from './struct'

export interface NodeTable extends Node {
    s?: boolean
    state: number
    connection_rate?: number
    system?: SystemLoad
}

export interface TaskTable {
    s: boolean
    ID: string
    cronjob: boolean
    multi:boolean
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