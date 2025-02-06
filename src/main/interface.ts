import { WebSocket } from "ws"

export const PORT = 12080

export interface WebsocketPack {
    uuid: string
    websocket: WebSocket
}

export interface Header {
    name: string
    meta: string
    message: string
    data: any
}

export interface OnePath {
    path: string
}

export interface TwoPath {
    from: string
    to: string
}

export interface FeedBack {
    job_uuid: string
    message: string
}