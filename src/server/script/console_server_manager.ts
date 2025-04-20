import * as ws from 'ws';
import { Header } from "../interface";

type calltype = { [key:string]:Function }

/**
 * Console server helper, cluster server side handle web client connection instances
 */
export class ConsoleServerManager {
    ws:ws.WebSocket
    typeMap: calltype
    messager_log:Function

    constructor(_ws:ws.WebSocket, _messager_log:Function, _typeMap: calltype){
        this.messager_log = _messager_log
        this.ws = _ws
        this.typeMap = _typeMap
    }

    Analysis = (h:Header) => {
        if (h == undefined){
            this.messager_log('[來源資料解析] 解析失敗, 得到的值為 undefined')
            return;
        }
        if (h.message != undefined && h.message.length > 0){
            this.messager_log(`[來源資料解析] ${h.message}`)
        }
        if (h.data == undefined) return
        if(this.typeMap.hasOwnProperty(h.name)){
            const castingFunc = this.typeMap[h.name]
            castingFunc(h.data, this.ws)
        }else{
            this.messager_log(`[來源資料解析] 解析失敗, 不明的來源標頭, name: ${h.name}, meta: ${h.meta}`)
        }
    }
}