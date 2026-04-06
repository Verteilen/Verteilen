// ========================
//                           
//      Share Codebase     
//                           
// ========================
//
//  ? Handle admin -> server
//  ? This thing exist in admin client space
//
import { io, Socket } from "socket.io-client"
import { BusType, EmitterProxy, Header, RawSend } from "verteilen-core/dist/interface"
export type Listener = (...args: any[]) => void

/**
 * Console helper, web client side handle cluster server connection instance
 */
export class ConsoleManager {
    url:string
    socket:Socket
    emitter:EmitterProxy<BusType>
    messager_log:Function
    events:Array<[string, Array<Listener>]>
    events_once:Array<[string, Array<Listener>]>
    buffer:Array<Header> = []

    constructor(url:string, messager_log:Function, emitter:EmitterProxy<BusType>){
        this.messager_log = messager_log
        this.url = url
        this.emitter = emitter
        this.events = []
        this.events_once = []
        this.socket = io(this.url, {
            transports: ['websocket'],
            secure: true,
            rejectUnauthorized: false,
        })
        this.socket.io.on('error', (err) => {
            this.messager_log(`[Error] Express Connection failed ${this.url}`)
        })
        this.socket.io.on('close', (reason, des) => {
            this.messager_log(`[Close] Express Client close, ${des}, ${reason}`)
            this.buffer = []
        })
        this.socket.io.on('open', () => {
            this.messager_log('[Connection] Express New Connection !')
            for(let i = 0; i < this.buffer.length; i++){
                this.socket.send(JSON.stringify(this.buffer[i]))
            }
            this.buffer = []
        })
        this.socket.io.on('packet', (packet) => {
            this.received(packet.data)
        })
    }

    public get readyState() : string {
        return this.socket.io._readyState
    }

    public get connected() : boolean {
        return this.readyState === 'open'
    }

    connect = () => {
        
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

    close = () => {
        if(this.connected){
            this.socket.close()
        }
    }

    send = (data:RawSend) => {
        const d:Header = {
            name: data.name,
            token: data.token,
            data: data.data
        }
        if(this.socket.io._readyState !== 'open'){
            this.buffer.push(d)
        }else{
            this.socket.send(JSON.stringify(d))
        }
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
        let p = false
        if(index != -1){
            const castingFunc = this.events[index][1]
            castingFunc.forEach(x => {
                if(h.data instanceof Array){
                    if(h.data.length == 1) x(h.data[0])
                    else x(...h.data)
                }else{
                    x(h.data)
                }
            })
            p = true
        }

        if(index2 != -1){
            const castingFunc = this.events_once[index2][1]
            castingFunc.forEach(x => {
                if(h.data instanceof Array){
                    if(h.data.length == 1) x(h.data[0])
                    else x(...h.data)
                }else{
                    x(h.data)
                }
            })
            this.events_once.splice(index2, 1)
            p = true
        }

        if(!p){
            this.messager_log(`[Source Analysis] Analysis Failed, Unknowed header, name: ${h.name}, meta: ${h.meta}`)
        }
    }
}