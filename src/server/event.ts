import fs from "fs";
import tcpPortUsed from 'tcp-port-used';
import ws, { WebSocket } from 'ws';
import { ClientJavascript } from "./client/javascript";
import { messager, messager_log } from "./debugger";
import { BusAnalysis, ExecuteProxy, ExecuteRecord, ExecuteState, FeedBack, Header, Job, Libraries, NodeProxy, Parameter, Preference, Project, Record, ShellFolder, Single, Task, WebsocketPack } from "./interface";
import { i18n } from "./plugins/i18n";
import { ConsoleServerManager } from "./script/console_server_manager";
import { ExecuteManager } from "./script/execute_manager";
import { WebsocketManager } from "./script/socket_manager";
import { Loader, TypeMap } from "./util/loader";

export class BackendEvent {
    manager:Array<ConsoleServerManager> = []
    websocket_manager:WebsocketManager
    execute_manager:Array<[ExecuteManager, ExecuteRecord]> = []
    shellBind = new Map()

    jsCall:ClientJavascript
    proxy: ExecuteProxy
    libs:Libraries = {libs: []}
    
    constructor(){
        this.jsCall = new ClientJavascript(messager, messager_log, () => undefined)
        this.proxy = {
            executeProjectStart: (data:Project):void => { this.Boradcasting('executeProjectStart', data) },
            executeProjectFinish: (data:Project):void => { this.Boradcasting('executeProjectFinish', data) },
            executeTaskStart: (data:[Task, number]):void => { this.Boradcasting('executeTaskStart', data) },
            executeTaskFinish: (data:Task):void => { this.Boradcasting('executeTaskFinish', data) },
            executeSubtaskStart: (data:[Task, number, string]):void => { this.Boradcasting('executeSubtaskStart', data) },
            executeSubtaskUpdate: (data:[Task, number, string, ExecuteState]) => { this.Boradcasting('executeSubtaskUpdate', data) },
            executeSubtaskFinish: (data:[Task, number, string]):void => { this.Boradcasting('executeSubtaskFinish', data) },
            executeJobStart: (data:[Job, number, string]):void => { this.Boradcasting('executeJobStart', data) },
            executeJobFinish: (data:[Job, number, string, number]):void => { this.Boradcasting('executeJobFinish', data) },
            feedbackMessage: (data:FeedBack):void => { this.Boradcasting('feedbackMessage', data) },
            updateParameter: (data:Parameter) => { this.Boradcasting('updateParameter', data) },
        }
        const proxy2:NodeProxy = {
            shellReply: this.shellReply,
            folderReply: this.folderReply,
        }
        this.websocket_manager = new WebsocketManager(this.newConnect, this.disconnect, this.analysis, messager_log, proxy2)
    }

    // The new manager enter the hood
    NewConsoleConsole = (socket:ws.WebSocket) => {
        console.log(`New Connection ${socket.url}`)
        let typeMap:TypeMap = {
            'javascript': this.javascript,
            'message': this.message,
            'load_record_obsolete': this.load_record_obsolete,
            'save_preference': this.save_preference,
            'load_preference': this.load_preference,
            // Unique
            'resource_start': this.resource_start,
            'resource_end': this.resource_end,
            'shell_enter': this.shell_enter,
            'shell_open': this.shell_open,
            'shell_close': this.shell_close,
            'shell_folder': this.shell_folder,
            'node_list': this.node_list,
            'node_add': this.node_add,
            'node_update': this.node_update,
            'node_delete': this.node_delete,
            'console_add': this.ConsoleAdd
        }
        Loader(typeMap, 'record', 'record')
        Loader(typeMap, 'parameter', 'parameter')
        Loader(typeMap, 'node', 'node')
        Loader(typeMap, 'log', 'log')
        Loader(typeMap, 'lib', 'lib', '')
        Loader(typeMap, 'user', 'user')
        const n = new ConsoleServerManager(socket, messager_log, typeMap)
        this.manager.push(n)
        return n
    }

    DropConsoleConsole = (socket:ws.WebSocket) => {
        const index = this.manager.findIndex(x => x.ws == socket)
        if(index != -1) this.manager.splice(index, 1)
    }

    ConsoleAnalysis = (socket:ws.WebSocket, h:Header) => {
        const index = this.manager.findIndex(x => x.ws == socket)
        if(index != -1) {
            this.manager[index].Analysis(h)
        } else {
            const n = this.NewConsoleConsole(socket)
            n.Analysis(h)
        }
    }

    private shell_enter = (socket:ws.WebSocket, uuid: string, value:string) => {
        this.websocket_manager.shell_enter(uuid, value)
    }

    private shell_open = (socket:ws.WebSocket, uuid: string) => {
        this.websocket_manager.shell_open(uuid)
        if(this.shellBind.has(uuid)){
            this.shellBind.get(uuid).push(socket)
        }else{
            this.shellBind.set(uuid, [socket])
        }
    }

    private shell_close = (socket:ws.WebSocket, uuid: string) => {
        this.websocket_manager.shell_close(uuid)
        if(this.shellBind.has(uuid)){
            const p:Array<ws.WebSocket> = this.shellBind.get(uuid)
            const index = p.findIndex(x => x == socket)
            if(index != -1) p.splice(index, 1)
            this.shellBind.set(uuid, p)
        }
    }

    private shell_folder = (socket:ws.WebSocket, uuid: string, path:string) => {
        this.websocket_manager.shell_folder(uuid, path)
    }

    private resource_start = (socket:ws.WebSocket, uuid:string) => {
        const p = this.websocket_manager.targets.find(x => x.uuid == uuid)
        const d:Header = { name: 'resource_start', data: 0 }
        p?.websocket.send(JSON.stringify(d))
    }

    private resource_end = (socket:ws.WebSocket, uuid:string) => {
        const p = this.websocket_manager.targets.find(x => x.uuid == uuid)
        const d:Header = { name: 'resource_end', data: 0 }
        p?.websocket.send(JSON.stringify(d))
    }

    private node_list = (socket:ws.WebSocket) => {
        const h:Header = {
            name: "node_list-feedback",
            data: this.websocket_manager?.targets
        }
        socket.send(JSON.stringify(h))
    }

    private node_add = (socket:ws.WebSocket, url:string, id:string) => {
        const h:Header = {
            name: "node_add-feedback",
            data: this.websocket_manager?.server_start(url, id)
        }
        socket.send(JSON.stringify(h))
    }

    private node_update = (socket:ws.WebSocket) => {
        const h:Header = {
            name: "node_update-feedback",
            data: [this.websocket_manager?.server_update()]
        }
        socket.send(JSON.stringify(h))
    }

    private node_delete = (socket:ws.WebSocket, uuid:string, reason?:string) => {
        this.websocket_manager?.server_stop(uuid, reason)
    }

    //#region Server Side
    private newConnect = (x:WebsocketPack) => {
        this.Boradcasting('makeToast', {
            title: i18n.global.t('toast.connection-create-title'),
            type: 'success',
            message: `${i18n.global.t('toast.connection-create-des')}: ${x.websocket.url} \n${x.uuid}`
        })
        this.execute_manager.forEach(y => {
            y[0].NewConnection(x)
        })
    }

    private disconnect = (x:WebsocketPack) => {
        this.Boradcasting('makeToast', {
            title: i18n.global.t('toast.connection-remove-title'),
            type: 'danger',
            message: `${i18n.global.t('toast.connection-remove-des')}: ${x.websocket.url} \n${x.uuid}`
        })
    }

    private analysis = (d:BusAnalysis) => {
        this.execute_manager.forEach(x => x[0].Analysis(JSON.parse(JSON.stringify(d))))
    }

    private shellReply = (data:Single, p?:WebsocketPack) => {
        if(p == undefined) return
        if(this.shellBind.has(p.uuid)){
            const k:Array<ws.WebSocket> = this.shellBind.get(p.uuid)
            k.forEach(x => {
                const h:Header = {
                    name: "shellReply", data: data
                }
                x.send(JSON.stringify(h))
            })
        }
    }

    private folderReply = (data:ShellFolder, p?:WebsocketPack) => {
        if(p == undefined) return
        if(this.shellBind.has(p.uuid)){
            const k:Array<ws.WebSocket> = this.shellBind.get(p.uuid)
            k.forEach(x => {
                const h:Header = {
                    name: "folderReply", data: data
                }
                x.send(JSON.stringify(h))  
            })
        }
    }
    //#endregion

    //#region Manager Side
    private javascript = (socket:ws.WebSocket, content:string) => {
        const javascript_messager_feedback = (msg:string, tag?:string) => {
            messager(msg, tag)
            const d:Header = {
                name: 'javascript-feedback',
                data: msg
            }
            socket.send(JSON.stringify(d))
        }
        const r = this.jsCall.JavascriptExecute(content, javascript_messager_feedback)
        const d:Header = {
            name: 'javascript-feedback',
            data: r?.toString() ?? ''
        }
        socket.send(JSON.stringify(d))
    }

    private message = (d:{message:string, tag?:string}, socket:ws.WebSocket) => {
        console.log(`${ d.tag == undefined ? '[Electron Backend]' : '[' + d.tag + ']' } ${d.message}`);
    }
    private load_record_obsolete = (dummy: number, socket:ws.WebSocket) => {
        if(!fs.existsSync('record.json')) return undefined
        const data = fs.readFileSync('record.json').toString()
        fs.rmSync('record.json')
        const d:Header = {
            name: "load_record_obsolete-feedback",
            data: data
        }
        socket.send(JSON.stringify(d))
    }
    private save_preference = (preference:string, socket:ws.WebSocket) => {
        fs.writeFileSync('preference.json', preference)
    }
    private load_preference = (dummy: number, socket:ws.WebSocket) => {
        const exist = fs.existsSync('preference.json');
        messager_log(`[Event] Read preference.js, file exist: ${exist}`)
        if(!exist){
            const record:Preference = {
                lan: 'en',
                log: true,
                font: 18,
                theme: "dark",
                notification: false,
            }
            fs.writeFileSync('preference.json', JSON.stringify(record, null, 4))
            i18n.global.locale = 'en'
            const d:Header = {
                name: "load_preference-feedback",
                data: JSON.stringify(record)
            }
            socket.send(JSON.stringify(d))
        } else {
            const file = fs.readFileSync('preference.json', { encoding: 'utf8', flag: 'r' })
            const d:Header = {
                name: "load_preference-feedback",
                data: file
            }
            socket.send(JSON.stringify(d))
        }
    }

    PortAvailable = async (start:number) => {
        let port_result = start
        let canbeuse = false

        while(!canbeuse){
            await tcpPortUsed.check(port_result).then(x => {
                canbeuse = !x
            }).catch(err => {
                canbeuse = true
            })
            if(!canbeuse) port_result += 1
        }

        return port_result
    }

    Boradcasting = (name:string, data:any) => {
        const d:Header = {
            name: name,
            data: data
        }
        this.manager.forEach(x => {
            x.ws.send(JSON.stringify(d))
        })
    }
    //#endregion

    ConsoleAdd = (data:any, socket:ws.WebSocket) => {
        const n:string = data.name
        const r:Record = data.record
    }
}


export const backendEvent = new BackendEvent()
