import { Project } from "./base"

type ProjectCall = (p:Project) => Project

/**
 * The websocket instance with extra information
 */
export interface WebsocketPack {
    s?:boolean
    uuid: string
    websocket: WebSocket
    current_job: Array<string>
    information?: SystemLoad
    load?: NodeLoad
    ms?: number
    last?: number
}

export interface CronWebsocketPack {
    websocket: WebsocketPack
}

/**
 * The data transfer packet header
 */
export interface Header {
    /**
     * Header name, it will match the function dict in both server and client side
     */
    name: string
    /**
     * Token for encryption
     */
    token?: string
    /**
     * Extra metadata
     */
    meta?: string
    /**
     * Print message
     */
    message?: string
    /**
     * Resource channel
     */
    channel?:string
    /**
     * The data content
     */
    data?: any
}

export interface Single {
    data: any
}

export interface OnePath {
    path: string
}

export interface TwoPath {
    from: string
    to: string
}

export interface Setter {
    key: string
    value: any
}

export interface FeedBack {
    node_uuid?: string
    index?: number
    job_uuid: string
    runtime_uuid: string
    meta: number
    message: string
}


export interface KeyValue {
    key: any
    value: any
}

export interface JWT {
    user: string
    create: number
    expire: number
}

export interface SystemLoad_GPU {
    gpu_name: string
}

export interface SystemLoad_Network {
    net_name: string
    upload: number
    download: number
}

export interface SystemLoad_Disk {
    disk_name: string
    disk_type: string
    disk_usage: number
    disk_free: number
    disk_total: number
    disk_percentage: number
}

/**
 * The resources usage 
 */
export interface SystemLoad {
    system_name: string
    virtual: boolean
    platform: string
    arch: string
    hostname: string

    cpu_name: string
    cpu_core: number
    cpu_usage: number

    ram_usage: number
    ram_free: number
    ram_total: number

    battery: number
    charging: boolean

    gpu: Array<SystemLoad_GPU>
    disk: Array<SystemLoad_Disk>
    net: Array<SystemLoad_Network>

    pid_usage: number
}

/**
 * The application usage 
 */
export interface NodeLoad {
    /**
     * How many worker has been running right now
     */
    workers: number
}

/**
 * The shell display folder structure
 */
export interface ShellFolder {
    /**
     * Current path, If null then it will use cwd instead
     */
    path: string
    /**
     * The process.cwd path
     */
    cwd: string
    /**
     * Files list in the path
     */
    files: Array<string>
    /**
     * Folders list in the path
     */
    folders: Array<string>
}

export interface TemplateGroup {
    value: number
    group: string
    template: ProjectCall
}