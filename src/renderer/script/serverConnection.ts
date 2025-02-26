import { EventEmitter } from "events"
import { messager_log } from "./debugger"

export class ServerConnection extends EventEmitter {
    ws:WebSocket

    constructor(url:string){
        super()
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

        }
    }
}