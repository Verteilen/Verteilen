// ========================
//                           
//      Share Codebase     
//                           
// ========================
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
            this.messager_log('[Source Analysis] Failed, Get a undefined value')
            return;
        }
        if (h.message != undefined && h.message.length > 0){
            this.messager_log(`[Source Analysis] ${h.message}`)
        }
        if (h.data == undefined) return
        if(this.typeMap.hasOwnProperty(h.name)){
            const castingFunc = this.typeMap[h.name]
            if(h.data instanceof Array){
                if(h.data.length == 1) castingFunc(this.ws, h.data[0])
                else castingFunc(this.ws, ...h.data)
            }else{
                castingFunc(this.ws, h.data)
            }
        }else{
            this.messager_log(`[Source Analysis] Failed, Unknown, name: ${h.name}, meta: ${h.meta}`)
        }
    }
}