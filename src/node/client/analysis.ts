import { WebSocket } from 'ws';
import { Header } from "../interface";
import { ClientExecute } from "./execute";

/**
 * The analysis worker. decode the message received from cluster server
 */
export class ClientAnalysis {
    private messager_log: Function
    private exec:ClientExecute

    constructor(_messager_log:Function, _exec:ClientExecute){
        this.exec = _exec
        this.messager_log = _messager_log
    }

    /**
     * Analysis the package
     * @param h Package
     * @param source Websocket instance
     */
    analysis = (h:Header | undefined, source:WebSocket) => {
        const typeMap = {
            'execute_job': this.exec.execute_job,
            'stop_job': this.exec.stop_job,
            'set_parameter': this.exec.set_parameter,
            'set_libs': this.exec.set_libs,
            'set_string': this.exec.set_string,
            'set_number': this.exec.set_number,
            'set_boolean': this.exec.set_boolean,
            'open_shell': this.exec.open_shell,
            'close_shell': this.exec.close_shell,
            'enter_shell': this.exec.enter_shell,
            'ping': this.pong,
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
            castingFunc(h.data, source)
        }else{
            this.messager_log(`[Source Analysis] Analysis Failed, Unknowed header, name: ${h.name}, meta: ${h.meta}`)
        }
    }

    /**
     * Network delay request
     * @param data Dummy value, should always be 0
     * @param source The cluster server websocket instance
     */
    pong = (data:number, source: WebSocket) => {
        const h:Header = { name: 'pong', data: data }
        source.send(JSON.stringify(h))
    }
}