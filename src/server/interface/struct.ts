import { ExecuteState } from "./enum"

export interface WebsocketPack {
    s?:boolean
    uuid: string
    websocket: WebSocket
    current_job?: string
    state?: ExecuteState
}

export interface CronWebsocketPack {
    websocket: WebsocketPack
}

export interface Header {
    name: string
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