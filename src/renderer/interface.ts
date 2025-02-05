export interface IMessage {
    ison: boolean,
    timer: number,
    variant: any,
    title: string,
    content: string
}

export interface ToastData {
    title: string,
    type: string,
    message: string
}

export type BusType = {
    makeToast: ToastData,
    modeSelect: boolean
}