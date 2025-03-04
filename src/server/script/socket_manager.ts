import { v6 as uuidv6 } from 'uuid';
import { Header, Node, NodeTable, WebsocketPack } from "../interface";

export class WebsocketManager {

    targets:Array<WebsocketPack> = []
    newConnect:Function
    disconnect:Function
    onAnalysis:Function
    messager_log:Function

    constructor(
        _newConnect:Function,
        _disconnect:Function,
        _onAnalysis:Function,
        _messager_log:Function,){
        this.newConnect = _newConnect
        this.disconnect = _disconnect
        this.onAnalysis = _onAnalysis
        this.messager_log = _messager_log
    }

    server_start = (url:string) => this.serverconnect(url)
    server_stop = (uuid:string, reason?:string) => this.removeByUUID(uuid, reason)
    server_update = ():Array<NodeTable> => this.sendUpdate()
    server_record = (ns:Array<Node>) => {
        ns.forEach(x => {
            this.serverconnect(x.url, x.ID)
        })
    }

    private serverconnect = (url:string, uuid?:string) => {
        if(this.targets.findIndex(x => x.websocket.url.slice(0, -1) == url) != -1) return
        const client = new WebSocket(url)
        const index = this.targets.push({ uuid: uuid == undefined ? uuidv6() : uuid, websocket: client })
        client.onerror = (err:any) => {
            this.messager_log(`[Socket] Connect failed ${url}`)
        }
        client.onclose = (ev) => {
            if(this.targets[index - 1].s != undefined){
                this.messager_log(`[Socket] Client close connection, ${ev.code}, ${ev.reason}`)
                this.disconnect(this.targets[index - 1])
            }
            this.targets[index - 1].s = undefined
            this.targets[index - 1].state = undefined
            this.targets[index - 1].current_job = undefined
        }
        client.onopen = () => {
            this.messager_log('[Socket] New Connection !' + client.url)
            if(this.targets[index - 1].s == undefined){
                this.targets[index - 1].s = true
            }
            this.sendUpdate()
            this.newConnect(this.targets[index - 1])
        }
        client.onmessage = (ev) => {
            const h:Header | undefined = JSON.parse(ev.data.toString());
            const c = this.targets.find(x => x.websocket == client)
            this.analysis(h, c)
        }
        return client
    }

    private analysis = (h:Header | undefined, c:WebsocketPack | undefined) => {
        if (h == undefined){
            this.messager_log('[Source Analysis] Decode failed, Get value undefined')
            return;
        }
        if (h.message != undefined && h.message.length > 0){
            this.messager_log(`[Source Analysis] ${h.message}`)
        }
        if (h.data == undefined) return
        this.onAnalysis({name: h.name, h: h, c: c})
    }

    private sendUpdate = (): Array<NodeTable> => {
        let result:Array<NodeTable> = []
        const data:Array<Node> = []
        this.targets.forEach(x => {
            if(x.websocket.readyState == WebSocket.CLOSED){
                data.push({ID: x.uuid, url: x.websocket.url})
            }
        })
        data.forEach(d => this.removeByUUID(d.ID))
        data.forEach(d => {
            this.serverconnect(d.url, d.ID)
        })

        result = this.targets.map(x => {
            return {
                ID: x.uuid,
                state: x.websocket.readyState,
                url: x.websocket.url,
                connection_rate: 0
            }
        })

        return result
    }

    private removeByUUID = (uuid:string, reason?:string) => {
        let index = this.targets.findIndex(x => x.uuid == uuid)
        if(index != -1) {
            if(this.targets[index].websocket.readyState == WebSocket.OPEN) this.targets[index].websocket.close(1000, reason != undefined ? reason : '')
                this.targets.splice(index, 1)
        }
    }
}