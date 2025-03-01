import * as ws from "ws"
import { EventEmitter } from "ws"
import { Auth, GenerateToken, QuickVerify } from "./auth/auth"
import { LuaTest } from "./client/lua"
import { messager_log } from "./debugger"
import { Header, Login } from "./interface"

interface ServerPack {
    websocket: ws.WebSocket
    token: string
}

/**
 * This entire class handle the connection from console\
 * Not the nodes
 */
export class ServerConnection {
    private ws:ServerPack
    private consoleEvent:EventEmitter = new EventEmitter()

    constructor(target:ws.WebSocket){
        this.consoleEvent.on('load_preference_call', this.load_preference_call)
        this.consoleEvent.on('login', this.login)

        this.ws = {
            websocket: target,
            token: ''
        }
        this.ws.websocket.onerror = (err:any) => {
            messager_log(`[錯誤事件] Express 連線失敗 ${target.url}`)
        }
        this.ws.websocket.onclose = (ev) => {
            messager_log(`[關閉事件] Express  客戶端關閉連線, ${ev.code}, ${ev.reason}`)
        }
        this.ws.websocket.onopen = () => {
            messager_log('[連線事件] Express  新連線狀態建立 !')
        }
        this.ws.websocket.onmessage = (ev) => {
            const d:Header = JSON.parse(ev.data.toString())
            this.analysis(d)
        }
    }

    analysis = (h:Header | undefined) => {
        if (h == undefined){
            messager_log('[來源資料解析] 解析失敗, 得到的值為 undefined')
            return;
        }
        if (h.message != undefined && h.message.length > 0){
            messager_log(`[來源資料解析] ${h.message}`)
        }
        if (h.data == undefined) return
        if (h.token != undefined) this.ws.token = h.token
        this.consoleEvent.emit(h.name, h.data)
    }    

    load_preference_call = (data:string) => {
        
    }

    login = async (data:Login) => {
        const pass = await Auth(data.username, data.password)
        if(pass){
            const token = GenerateToken(data.username, new Date(Date.now() + new Date(0,0,14).getTime()))
            const t:Header = {
                name: "receivedToken",
                data: token
            }
            this.ws.websocket.send(JSON.stringify(t))
        }
    }

    lua = async (d:{websocket:ServerPack, data:string}) => {
        LuaTest(d.data)
    }
    message = async (data:{message:string, tag?:string}) => {
        console.log(`${ data.tag == undefined ? '[後台訊息]' : '[' + data.tag + ']' } ${data.message}`);
    }
    locate = async (data:string) => {

    }
    save_record = async (data:string) => {
        const result = await QuickVerify(this.ws.token)
        if(result[0]){

        }else{
            
        }
    }
    load_record = () => {
        
    }
    save_log = (data:string) => {
        
    }
    load_log = () => {
        
    }
    save_lib = (data:string) => {
        
    }
    load_lib = () => {
        
    }
    save_preference = (data:string) => {
        
    }
    load_preference = () => {
        
    }
}