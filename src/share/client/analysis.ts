import { WebSocket } from 'ws';
import { Header, Messager } from "../interface";
import { Client } from './client';
import { ClientExecute } from "./execute";
import { ClientResource } from './resource';

/**
 * The analysis worker. decode the message received from cluster server
 */
export class ClientAnalysis {
    private messager: Messager
    private messager_log: Messager
    private client:Client
    private exec:ClientExecute
    private resource:ClientResource
    private resource_wanter:Array<WebSocket> = []

    private resource_cache:Header | undefined = undefined

    constructor(_messager:Messager, _messager_log:Messager, _client:Client){
        this.client = _client
        this.messager = _messager
        this.messager_log = _messager_log
        this.resource = new ClientResource()
        this.exec = new ClientExecute(_messager, _messager_log, this.client)
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
            'open_shell': this.exec.open_shell,
            'close_shell': this.exec.close_shell,
            'enter_shell': this.exec.enter_shell,
            'resource_start': this.resource_start,
            'resource_end': this.resource_end,
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

    resource_start = (data:number, source: WebSocket) => {
        this.resource_wanter.push(source)
        this.messager_log(`Register resource_wanter!, count: ${this.resource_wanter.length}`)
        if(this.resource_cache != undefined) source.send(JSON.stringify(this.resource_cache))
    }

    resource_end = (data:number, source: WebSocket) => {
        const index = this.resource_wanter.findIndex(x => x ==source)
        if(index != -1) {
            this.resource_wanter.splice(index, 1)
            this.messager_log(`UnRegister resource_wanter!, count: ${this.resource_wanter.length}`)
        }
    }

    update = (client:Client) => {
        if(this.resource.is_query == false && this.resource_wanter.length > 0){
            this.resource.Query().then(x => {
                const h:Header = {
                    name: 'system_info',
                    data: x
                }
                this.resource_wanter.forEach(x => x.send(JSON.stringify(h)))
                this.resource_cache = h
            })
        }
        const h:Header = {
            name: 'system_info',
            data: this.resource_cache
        }
        this.resource_wanter.forEach(x => x.send(JSON.stringify(h)))
    }

    disconnect = (source: WebSocket) => {
        this.exec.disconnect(source)
    }
}
