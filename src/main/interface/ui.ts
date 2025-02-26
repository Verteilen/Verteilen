export interface IMessage {
    ison: boolean,
    timer: number,
    variant: any,
    title: string,
    content: string
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
}