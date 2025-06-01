import { BusType, EmitterProxy, Header, RawSend } from "../interface"

export type Listener = (...args: any[]) => void

/**
 * Console helper, web client side handle cluster server connection instance
 */
export class ConsoleManager {
    url:string
    ws:WebSocket
    emitter:EmitterProxy<BusType>
    messager_log:Function
    events:Array<[string, Array<Listener>]>
    events_once:Array<[string, Array<Listener>]>

    constructor(_url:string, _messager_log:Function, _emitter:EmitterProxy<BusType>){
        this.messager_log = _messager_log
        this.url = _url
        this.emitter = _emitter
        this.events = []
        this.events_once = []
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

    on = (channel: string, listener: Listener) => {
        const index = this.events.findIndex(x => x[0] == channel)
        if(index == -1){
            this.events.push([channel, [listener]])
        }else{
            this.events[index][1].push(listener)
        }
    }

    once = (channel: string, listener: Listener) => {
        const index = this.events.findIndex(x => x[0] == channel)
        if(index == -1){
            this.events_once.push([channel, [listener]])
        }else{
            this.events_once[index][1].push(listener)
        }
    }

    off = (channel: string, listener: Listener) => {
        const index = this.events.findIndex(x => x[0] == channel)
        if(index == -1){
            return
        }else{
            const index2 = this.events[index][1].findIndex(x => x == listener)
            if(index2 != -1) this.events[index][1].splice(index2, 1)
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

    received = (h:Header) => {
        if (h == undefined){
            this.messager_log('[Source Analysis] Analysis Failed, Value is undefined')
            return;
        }
        if (h.message != undefined && h.message.length > 0){
            this.messager_log(`[Source Analysis] ${h.message}`)
        }
        if (h.data == undefined) return
        const index = this.events.findIndex(x => x[0] == h.name)
        const index2 = this.events_once.findIndex(x => x[0] == h.name)
        if(index != -1){
            const castingFunc = this.events[index][1]
            castingFunc.forEach(x => x(h.data))
        }else{
            this.messager_log(`[Source Analysis] Analysis Failed, Unknowed header, name: ${h.name}, meta: ${h.meta}`)
        }

        if(index2 != -1){
            const castingFunc = this.events_once[index2][1]
            castingFunc.forEach(x => x(h.data))
            this.events_once.splice(index2, 1)
        }else{
            this.messager_log(`[Source Analysis] Analysis Failed, Unknowed header, name: ${h.name}, meta: ${h.meta}`)
        }
    }
}