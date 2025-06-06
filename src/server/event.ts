import fs from "fs";
import tcpPortUsed from 'tcp-port-used';
import ws from 'ws';
import { ClientJavascript } from "./client/javascript";
import { messager, messager_log } from "./debugger";
import { BusAnalysis, ExecuteProxy, ExecuteState, FeedBack, Header, Job, Libraries, NodeProxy, Parameter, Preference, Project, Record, ShellFolder, Single, Task, WebsocketPack } from "./interface";
import { i18n } from "./plugins/i18n";
import { ConsoleServerManager } from "./script/console_server_manager";
import { WebsocketManager } from "./script/socket_manager";
import { Loader, TypeMap } from "./util/loader";
import { Util_Server } from "./util/server/server";

export class BackendEvent {
    manager:Array<ConsoleServerManager> = []

    jsCall:ClientJavascript
    util: Util_Server = new Util_Server(this)
    libs:Libraries = {libs: []}
    
    constructor(){
        this.jsCall = new ClientJavascript(messager, messager_log, () => undefined)
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
        }
        typeMap = this.util.EventInit(typeMap)
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

    private message = (socket:ws.WebSocket, message:string, tag?:string) => {
        console.log(`${ tag == undefined ? '[Electron Backend]' : '[' + tag + ']' } ${message}`);
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
    private save_preference = (socket:ws.WebSocket, preference:string) => {
        fs.writeFileSync('preference.json', preference)
    }
    private load_preference = (socket:ws.WebSocket) => {
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
            this.util.preference = record
            socket.send(JSON.stringify(d))
        } else {
            const file = fs.readFileSync('preference.json', { encoding: 'utf8', flag: 'r' })
            const d:Header = {
                name: "load_preference-feedback",
                data: file
            }
            this.util.preference = JSON.parse(file)
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

    console_add = (data:any, socket:ws.WebSocket) => {
        const n:string = data.name
        const r:Record = data.record
    }
}


export const backendEvent = new BackendEvent()
