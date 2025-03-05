import { BusType, EmitterProxy, Header, RawSend } from "../interface"

export class ConsoleManager {
    url:string
    ws:WebSocket
    emitter:EmitterProxy<BusType>
    messager_log:Function

    constructor(_url:string, _messager_log:Function, _emitter:EmitterProxy<BusType>){
        this.messager_log = _messager_log
        this.url = _url
        this.emitter = _emitter
        this.ws = new WebSocket(this.url)
        this.ws.onerror = (err:any) => {
            this.messager_log(`[錯誤事件] Express 連線失敗 ${this.url}`)
        }
        this.ws.onclose = (ev) => {
            this.messager_log(`[關閉事件] Express  客戶端關閉連線, ${ev.code}, ${ev.reason}`)
        }
        this.ws.onopen = () => {
            this.messager_log('[連線事件] Express  新連線狀態建立 !')
        }
        this.ws.onmessage = (ev) => {
            this.received(JSON.parse(ev.data.toString()))
        }
    }

    send = (data:RawSend) => {
        const d:Header = {
            name: data.name,
            token: data.token,
            data: data.data
        }
        this.ws.send(JSON.stringify(d))
    }

    private received = (h:Header) => {
        const typeMap:{ [key:string]:Function } = {
        }
        if (h == undefined){
            this.messager_log('[來源資料解析] 解析失敗, 得到的值為 undefined')
            return;
        }
        if (h.message != undefined && h.message.length > 0){
            this.messager_log(`[來源資料解析] ${h.message}`)
        }
        if (h.data == undefined) return
        if(typeMap.hasOwnProperty(h.name)){
            const castingFunc = typeMap[h.name]
            castingFunc(h.data)
        }else{
            this.messager_log(`[來源資料解析] 解析失敗, 不明的來源標頭, name: ${h.name}, meta: ${h.meta}`)
        }
    }

    
}