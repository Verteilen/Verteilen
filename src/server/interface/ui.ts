// ========================
//                           
//      Share Codebase     
//                           
// ========================
export interface AppConfig {
    isExpress: boolean
    isElectron: boolean
    isAdmin: boolean
    haveBackend: boolean
    login:boolean
}

export interface IMessage {
    ison: boolean
    timer: number
    variant: any
    title: string
    content: string
    stack: Array<string>
}

export interface ClientLog {
    s: boolean
    tag: string
    title: string
    text: Array<string>
}

export interface ToastData {
    title: string,
    type: string,
    message: string
    stack?: Array<string>
}