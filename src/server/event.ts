import fs from "fs";
import path from "path";
import tcpPortUsed from 'tcp-port-used';
import ws from 'ws';
import { ClientLua } from "./client/lua";
import { messager, messager_log } from "./debugger";
import { BusAnalysis, ExecuteProxy, ExecuteState, FeedBack, Header, Job, Libraries, Parameter, Preference, Project, ShellFolder, Single, Task, WebsocketPack } from "./interface";
import { i18n } from "./plugins/i18n";
import { ConsoleServerManager } from "./script/console_server_manager";
import { ExecuteManager } from "./script/execute_manager";
import { WebsocketManager } from "./script/socket_manager";

type TypeMap = { [key:string]:Function }

export class BackendEvent {
    manager:Array<ConsoleServerManager> = []
    websocket_manager:WebsocketManager
    execute_manager:ExecuteManager
    
    lubCall:ClientLua
    libs:Libraries = {libs: []}
    
    constructor(){
        this.lubCall = new ClientLua(messager, messager_log, () => undefined)

        const proxy:ExecuteProxy = {
            executeProjectStart: (data:Project):void => { this.Boradcasting('executeProjectStart', data) },
            executeProjectFinish: (data:Project):void => { this.Boradcasting('executeProjectFinish', data) },
            executeTaskStart: (data:[Task, number]):void => { this.Boradcasting('executeTaskStart', data) },
            executeTaskFinish: (data:Task):void => { this.Boradcasting('executeTaskFinish', data) },
            executeSubtaskStart: (data:[Task, number, string]):void => { this.Boradcasting('executeSubtaskStart', data) },
            executeSubtaskUpdate: (data:[Task, number, string, ExecuteState]) => {},
            executeSubtaskFinish: (data:[Task, number, string]):void => { this.Boradcasting('executeSubtaskFinish', data) },
            executeJobStart: (data:[Job, number, string]):void => { this.Boradcasting('executeJobStart', data) },
            executeJobFinish: (data:[Job, number, string, number]):void => { this.Boradcasting('executeJobFinish', data) },
            feedbackMessage: (data:FeedBack):void => { this.Boradcasting('feedbackMessage', data) },
            updateParameter: (data:Parameter) => {},
            shellReply: (data:Single) => {},
            folderReply: (data:ShellFolder) => {},
        }

        this.websocket_manager = new WebsocketManager(this.newConnect, this.disconnect, this.analysis, messager_log)
        this.execute_manager = new ExecuteManager(this.websocket_manager, messager_log)
        this.execute_manager.libs = this.libs
        this.execute_manager.proxy = proxy
        this.websocket_manager.newConnect = this.newConnect
        this.websocket_manager.disconnect = this.disconnect
        this.websocket_manager.onAnalysis = this.execute_manager.Analysis
    }

    NewConsole = (socket:ws.WebSocket) => {
        const typeMap:TypeMap = {
            'lua': this.lua,
            'message': this.message,
            'load_record_obsolete': this.load_record_obsolete,
            'save_preference': this.save_preference,
            'load_preference': this.load_preference,
        }
        this.Loader(typeMap, 'record', 'record')
        this.Loader(typeMap, 'node', 'node')
        this.Loader(typeMap, 'log', 'log')
        this.Loader(typeMap, 'lib', 'lib')
        const n = new ConsoleServerManager(socket, messager_log, typeMap)
        this.manager.push(n)
    }

    Loader = (typeMap:TypeMap, key:string, folder:string) => {
        typeMap[`load_all_${key}`] = (dummy: number, socket:ws.WebSocket) => {
            const root = path.join("data", folder)
            if (!fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
            const r:Array<string> = []
            const ffs = fs.readdirSync(root, {withFileTypes: true})
            ffs.forEach(x => {
                if(!x.isFile()) return
                const file = fs.readFileSync(path.join(root, x.name), { encoding: 'utf8', flag: 'r' })
                r.push(file)
            })
            const d:Header = {
                name: `load_all_${key}-feedback`,
                data: JSON.stringify(r)
            }
            socket.send(JSON.stringify(d))
        }
        typeMap[`delete_all_${key}`] = (dummy: number, socket:ws.WebSocket) => {
            const root = path.join("data", folder)
            if (fs.existsSync(root)) fs.rmSync(root, {recursive: true})
            fs.mkdirSync(root, {recursive: true})
        }
        typeMap[`list_all_${key}`] = (dummy: number, socket:ws.WebSocket) => {
            const root = path.join("data", folder)
            if (fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
            const ps = fs.readdirSync(root, { withFileTypes: false })
            ps.map(x => {
                const stat = fs.statSync(path.join(root, x))
                return {
                    name: x,
                    size: stat.size,
                    time: stat.ctime
                }
            })
            const d:Header = {
                name: `list_all_${key}-feedback`,
                data: JSON.stringify(ps)
            }
            socket.send(JSON.stringify(d))
        }
        typeMap[`save_${key}`] = (d:{name:string, data:string}, socket:ws.WebSocket) => {
            const root = path.join("data", folder)
            if (fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
            let filename = d.name + ".json"
            let p = path.join(root, filename)
            fs.writeFileSync(p, d.data)
        }
        typeMap[`rename_${key}`] = (d:{name:string, newname:string}, socket:ws.WebSocket) => {
            const root = path.join("data", folder)
            if (fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
            fs.cpSync(path.join(root, `${d.name}.json`), path.join(root, `${d.newname}.json`), { recursive: true })
            fs.rmdirSync(path.join(root, `${d.name}.json`))
        }
        typeMap[`delete_${key}`] = (name:string, socket:ws.WebSocket) => {
            const root = path.join("data", folder)
            if (fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
            const filename = name + ".json"
            const p = path.join(root, filename)
            if (fs.existsSync(p)) fs.rmSync(p)
        }
        typeMap[`delete_all_${key}`] = (name:string, socket:ws.WebSocket) => {
            const root = path.join("data", folder)
            if (fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
            const ps = fs.readdirSync(root, { withFileTypes: false })
            ps.forEach(x => fs.rmSync(path.join(root, x)))
        }
        typeMap[`load_${key}`] = (name:string, socket:ws.WebSocket) => {
            const root = path.join("data", folder)
            if (fs.existsSync(root)) fs.mkdirSync(root, {recursive: true})
            const filename = name + ".json"
            const p = path.join(root, filename)
            if (fs.existsSync(p)){
                const file = fs.readFileSync('log.json', { encoding: 'utf8', flag: 'r' })
                const d:Header = {
                    name: `load_${key}-feedback`,
                    data: file.toString()
                }
                socket.send(JSON.stringify(d))
            }else{
                const d:Header = {
                    name: `load_${key}-feedback`,
                    data: undefined
                }
                socket.send(JSON.stringify(d))
            }
        }
    }

    DropConsole = (socket:ws.WebSocket) => {
        const index = this.manager.findIndex(x => x.ws == socket)
        if(index != -1) this.manager.splice(index, 1)
    }

    Analysis = (socket:ws.WebSocket, h:Header) => {
        const index = this.manager.findIndex(x => x.ws == socket)
        if(index != -1) this.manager[index].Analysis(h)
    }

    //#region Server Side
    private newConnect = (x:WebsocketPack) => {
        this.Boradcasting('makeToast', {
            title: "連線建立",
            type: 'success',
            message: `建立新的連線: ${x.websocket.url} \n${x.uuid}`
        })
        this.execute_manager?.NewConnection(x)
    }

    private disconnect = (x:WebsocketPack) => {
        this.Boradcasting('makeToast', {
            title: "連線中斷",
            type: 'error',
            message: `連線中斷偵測: ${x.websocket.url} \n${x.uuid}`
        })
    }

    private analysis = (b:BusAnalysis) => {
        this.execute_manager?.Analysis(b)
    }
    //#endregion

    //#region Manager Side
    private lua = (content:string, socket:ws.WebSocket) => {
        const r = this.lubCall.LuaExecute(content)
        const d:Header = {
            name: 'lua-feedback',
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
}


export const backendEvent = new BackendEvent()
