import { BusWebType, Header, RawSend } from "../interface"
import { messager_log } from "./debugger"

export class ServerConnection {
    ws:WebSocket

    constructor(url:string){
        this.ws = new WebSocket(url)
        this.ws.onerror = (err:any) => {
            messager_log(`[錯誤事件] Express 連線失敗 ${url}`)
        }
        this.ws.onclose = (ev) => {
            messager_log(`[關閉事件] Express  客戶端關閉連線, ${ev.code}, ${ev.reason}`)
        }
        this.ws.onopen = () => {
            messager_log('[連線事件] Express  新連線狀態建立 !')
        }
        this.ws.onmessage = (ev) => {
            this.received(JSON.parse(ev.data.toString()))
        }
    }

    received = (d:Header) => {
        const data:Array<any> = d.data
        // @ts-ignore
        webEmitter.emit(d.name as keyof BusWebType, ...data)
    }

    send = (data:RawSend) => {
        const d:Header = {
            name: data.name,
            token: data.token,
            data: data.data
        }
        this.ws.send(JSON.stringify(d))
    }
}