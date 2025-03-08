import { ExecuteState } from "./enum"

export interface WebsocketPack {
    s?:boolean
    uuid: string
    websocket: WebSocket
    current_job?: string
    state?: ExecuteState
    information?: SystemLoad
    ms?: number
    last?: number
}

export interface CronWebsocketPack {
    websocket: WebsocketPack
}

export interface Header {
    name: string
    token?: string
    meta?: string
    message?: string
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
    job_uuid: string
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