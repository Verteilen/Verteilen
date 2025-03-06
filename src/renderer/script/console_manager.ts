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
            this.messager_log(`[Error] Express Connection failed ${this.url}`)
        }
        this.ws.onclose = (ev) => {
            this.messager_log(`[Close] Express Client close, ${ev.code}, ${ev.reason}`)
        }
        this.ws.onopen = () => {
            this.messager_log('[Connection] Express New Connection !')
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
            this.messager_log('[Source Analysis] Analysis Failed, Value is undefined')
            return;
        }
        if (h.message != undefined && h.message.length > 0){
            this.messager_log(`[Source Analysis] ${h.message}`)
        }
        if (h.data == undefined) return
        if(typeMap.hasOwnProperty(h.name)){
            const castingFunc = typeMap[h.name]
            castingFunc(h.data)
        }else{
            this.messager_log(`[Source Analysis] Analysis Failed, Unknowed header, name: ${h.name}, meta: ${h.meta}`)
        }
    }

    
}