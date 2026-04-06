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
    events:Array<[string, Listener]>
    events_once:Array<[string, Listener]>
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
            autoConnect: true,
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
                this.socket.send(this.buffer[i].name, this.buffer[i])
            }
            for(let i = 0; i < this.events.length; i++){
                this.socket.on(this.events[i][0], this.events[i][1])
            }
            for(let i = 0; i < this.events_once.length; i++){
                this.socket.once(this.events_once[i][0], this.events_once[i][1])
            }
            this.buffer = []
        })
    }

    public get Id() : string | undefined {
        return this.socket.id
    }

    public get readyState() : string {
        return this.socket.io._readyState
    }

    public get connected() : boolean {
        return this.readyState == 'open'
    }

    connect = () => {
        
    }

    on = (channel: string, listener: Listener) => {
        const index = this.events.findIndex(x => x[0] == channel)
        if(index == -1){
            this.events.push([channel, listener])
            this.socket.on(channel, listener)
        }
    }

    once = (channel: string, listener: Listener) => {
        const index = this.events.findIndex(x => x[0] == channel)
        if(index == -1){
            this.events_once.push([channel, listener])
            this.socket.once(channel, listener)
        }
    }

    off = (channel: string) => {
        const index = this.events.findIndex(x => x[0] == channel)
        if(index == -1){
            return
        }else{
            this.events[index].splice(index, 1)
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
        if(!this.connected){
            console.debug("[Debug Console_Manager] Send ! but socket is not connected", this.socket.io._readyState)
            this.buffer.push(d)
        }else{
            this.socket.emit(d.name, d)
        }
    }
}