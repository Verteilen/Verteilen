// ========================
//                           
//      Share Codebase     
//                           
// ========================
import { v6 as uuidv6 } from 'uuid';
import { BusAnalysis, Header, Node, NodeLoad, NodeProxy, NodeTable, Plugin, ShellFolder, Single, SocketState, SystemLoad, WebsocketPack } from "../interface";
import * as jsEnv from "browser-or-node";
import * as ws from 'ws'
import * as https from 'https'

function isRenderer () {
  // running in a web browser
  if (typeof process === 'undefined') return true

  // node-integration is disabled
  if (!process) return true

  // We're in node.js somehow
  // @ts-ignore
  if (!process.type) return false

  // @ts-ignore
  return process.type === 'renderer'
}

console.log("isRenderer", isRenderer())

/**
 * The node connection instance manager, Use by the cluster server
 */
export class WebsocketManager {
    targets:Array<WebsocketPack> = []
    newConnect:Function
    disconnect:Function
    onAnalysis:Function
    proxy:NodeProxy
    private messager_log:Function

    constructor(
        _newConnect:Function,
        _disconnect:Function,
        _onAnalysis:Function,
        _messager_log:Function,
        _proxy:NodeProxy){
        this.newConnect = _newConnect
        this.disconnect = _disconnect
        this.onAnalysis = _onAnalysis
        this.messager_log = _messager_log
        this.proxy = _proxy
        setInterval(this.update, 1000)
    }

    /**
     * Trying to connect a node by target URL
     * @param url target url
     * @returns The connection package
     */
    server_start = (url:string, id:string) => this.serverconnect(url, id)
    /**
     * Remove the package by UUID
     * @param uuid Key
     * @param reason Reason for disconnect
     */
    server_stop = (uuid:string, reason?:string) => this.removeByUUID(uuid, reason)
    /**
     * Manager update, it will does things below
     * * Retry connection
     * @returns Node table for display
     */
    server_update = ():Array<NodeTable> => this.sendUpdate()
    server_record = (ns:Array<Node>) => {
        ns.forEach(x => {
            this.serverconnect(x.url, x.ID)
        })
    }

    shell_open = (uuid:string) => {
        const p = this.targets.find(x => x.uuid == uuid && x.websocket.readyState == SocketState.OPEN)
        if (p == undefined){
            this.messager_log(`[Shell] Error cannot find the node by ID: ${uuid}`)
            return
        }
        const d:Header = {
            name: "open_shell",
            data: 0
        }
        p.websocket.send(JSON.stringify(d))
    }

    /**
     * Open shell connection with target node
     * @param uuid node UUID
     * @param text input data
     */
    shell_enter = (uuid:string, text:string) => {
        const p = this.targets.find(x => x.uuid == uuid && x.websocket.readyState == SocketState.OPEN)
        if (p == undefined){
            this.messager_log(`[Shell] Error cannot find the node by ID: ${uuid}`)
            return
        }
        const d:Header = {
            name: "enter_shell",
            data: text
        }
        p.websocket.send(JSON.stringify(d))
    }

    /**
     * Close shell connection with target node
     * @param uuid Node UUID
     * @returns 
     */
    shell_close = (uuid:string) => {
        const p = this.targets.find(x => x.uuid == uuid && x.websocket.readyState == SocketState.OPEN)
        if (p == undefined){
            this.messager_log(`[Shell] Error cannot find the node by ID: ${uuid}`)
            return
        }
        const d:Header = {
            name: "close_shell",
            data: 0
        }
        p.websocket.send(JSON.stringify(d))
    }

    /**
     * Check folder structure with target node
     * @param uuid Node UUID
     * @param path the folder path to check
     */
    shell_folder = (uuid:string, path:string) => {
        const p = this.targets.find(x => x.uuid == uuid && x.websocket.readyState == SocketState.OPEN)
        if (p == undefined){
            this.messager_log(`[Shell] Error cannot find the node by ID: ${uuid}`)
            return
        }
        const d:Header = {
            name: "shell_folder",
            data: path
        }
        p.websocket.send(JSON.stringify(d))
    }

    /**
     * Trying to connect a node by target URL
     * @param Node target url
     * @param uuid generate UUID, New or retry connect base on value is defined or not
     * @returns The connection package
     */
    private serverconnect = (url:string, uuid?:string) => {
        if(this.targets.findIndex(x => x.websocket.url.slice(0, -1) == url) != -1) return
        if(this.targets.findIndex(x => x.uuid == uuid) != -1) return

        let client: ws.WebSocket | WebSocket | undefined = undefined
        if(jsEnv.isNode) client = new ws.WebSocket(url, { agent: new https.Agent(), rejectUnauthorized: false });
        else client = new WebSocket(url);
        const t:WebsocketPack = { uuid: (uuid == undefined ? uuidv6() : uuid), websocket: client, current_job: [] }
        this.targets.push(t)
        client.onerror = (err:any) => {
            this.messager_log(`[Socket] Connect failed ${url} ${err.message}`)
        }
        client.onclose = (ev) => {
            if(t.s != undefined){
                this.messager_log(`[Socket] Client close connection, ${ev.code}, ${ev.reason}`)
                this.disconnect(t)
            }
            t.s = undefined
            t.current_job = []
        }
        client.onopen = () => {
            this.messager_log('[Socket] New Connection !' + client.url)
            if(t.s == undefined){
                t.s = true
            }
            this.sendUpdate()
            this.newConnect(t)
        }
        client.onmessage = (ev) => {
            const h:Header | undefined = JSON.parse(ev.data.toString());
            const c = this.targets.find(x => x.uuid == uuid)
            this.analysis(h, c)
        }
        return client
    }

    /**
     * The analysis method for the node connection instance
     * @param h Package
     * @param c Connection instance
     */
    private analysis = (h:Header | undefined, c:WebsocketPack | undefined) => {
        if (h == undefined){
            this.messager_log('[Source Analysis] Decode failed, Get value undefined')
            return;
        }
        if (h.message != undefined && h.message.length > 0){
            this.messager_log(`[Source Analysis] ${h.message}`)
        }
        if (h.data == undefined) return

        const d:BusAnalysis = {name: h.name, h: h, c: c}
        const pass = this.socket_analysis(d)
        if (!pass) this.onAnalysis(d)
    }

    private socket_analysis = (d:BusAnalysis) => {
        const typeMap:{ [key:string]:Function } = {
            'system_info': this.system_info,
            'shell_reply': this.shell_reply,
            'shell_folder_reply': this.shell_folder_reply,
            'node_info': this.node_info,
            'pong': this.pong,
            'plugin_info_reply': this.plugin_info_reply,
        }
        if(typeMap.hasOwnProperty(d.name)){
            const castingFunc = typeMap[d.h.name]
            castingFunc(d.h.data, d.c, d.h.meta)
            return true
        }else{
            return false
        }
    }

    /**
     * Manager update, it will does things below
     * * Retry connection
     * @returns Node table for display
     */
    private sendUpdate = (): Array<NodeTable> => {
        let result:Array<NodeTable> = []
        const data:Array<Node> = []
        this.targets.forEach(x => {
            if(x.websocket.readyState == SocketState.CLOSED){
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
                connection_rate: x.ms,
                system: x.information,
                plugins: x.plugins
            }
        })

        return result
    }

    /**
     * Remove the package by UUID
     * @param uuid Key
     * @param reason Reason for disconnect
     */
    private removeByUUID = (uuid:string, reason?:string) => {
        let index = this.targets.findIndex(x => x.uuid == uuid)
        if(index != -1) {
            if(this.targets[index].websocket.readyState == SocketState.OPEN) this.targets[index].websocket.close(1000, reason != undefined ? reason : '')
                this.targets.splice(index, 1)
        }
    }

    /**
     * Internal update, for checking the ping of every nodes
     */
    private update = () => {
        const h:Header = { name: 'ping', data: 0}
        this.targets.forEach(x => {
            if(x.websocket.readyState != SocketState.OPEN) return
            x.last = Date.now()
            x.websocket.send(JSON.stringify(h))
        })
    }


    /**
     * Recevied the shell text from client node
     */
    private shell_reply = (data:Single, w?:WebsocketPack) => {
        this.proxy?.shellReply(data, w)
    }
    /**
     * Recevied the folders from client node
     */
    private shell_folder_reply = (data:ShellFolder, w?:WebsocketPack) => {
        this.proxy?.folderReply(data, w)
    }
    /**
     * Get the system information and assign to the node object
     * @param info Data
     * @param source The node target
     */
    private system_info = (info:SystemLoad, source:WebsocketPack | undefined) => {
        if(source == undefined) return
        source.information = info
    }
    /**
     * Get the node information and assign to the node object
     * @param info Data
     * @param source The node target
     */
    private node_info = (info:NodeLoad, source:WebsocketPack | undefined) => {
        if(source == undefined) return
        source.load = info
    }

    /**
     * Get the bouncing back function call\
     * THis method will calculate the time different and assign the node object
     * @param info Dummy number, nothing important, can be ignore
     * @param source The node target
     */
    private pong = (info:number, source:WebsocketPack | undefined) => {
        if(source == undefined || source.last == undefined) return
        source.ms = Date.now() - source.last
    }

    private plugin_info_reply = (data:Array<Plugin>, source:WebsocketPack | undefined) => {
        if(source == undefined || source.last == undefined) return
        source.plugins = data
    }
}