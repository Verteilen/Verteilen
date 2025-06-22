import fs from "fs";
import tcpPortUsed from 'tcp-port-used';
import ws from 'ws';
import { ClientJavascript } from "./client/javascript";
import { messager, messager_log } from "./debugger";
import { GlobalPermission, Header, Libraries, LocalPermiision, Record, ServerSetting, UserProfile, UserProfileClient, UserType } from "./interface";
import { ConsoleServerManager } from "./script/console_server_manager";
import { Loader, TypeMap } from "./util/loader";
import { Util_Server } from "./util/server/server";
import { v6 as uuidv6 } from 'uuid'
import path from "path";

export class BackendEvent {
    manager:Array<ConsoleServerManager> = []

    setting: ServerSetting | undefined
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

    IsPass = (token:string) => {
        return true
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
    private save_preference = (socket:ws.WebSocket, preference:string, token?:string) => {
        if(token != undefined){
            const files = fs.readdirSync("data/user")
            for(let i = 0; i < files.length; i++){
                const p:UserProfile = JSON.parse(fs.readFileSync(path.join("data", "user", files[i])).toString())
                if(p.token == token){
                    p.preference = JSON.parse(preference)
                    fs.writeFileSync(path.join("data", "user", files[i]), JSON.stringify(p))
                    break
                }
            }
        }
    }
    private load_preference = (socket:ws.WebSocket, token?:string) => {
        if(token != undefined){
            const files = fs.readdirSync("data/user")
            for(let i = 0; i < files.length; i++){
                const p:UserProfile = JSON.parse(fs.readFileSync(path.join("data", "user", files[i])).toString())
                if(p.token == token){
                    const d:Header = {
                        name: "load_preference-feedback",
                        data: JSON.stringify(p.preference)
                    }
                    socket.send(JSON.stringify(d))
                    break
                }
            }
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

    //#region Server
    Root = () => {
        if(!fs.existsSync('data/user')) fs.mkdirSync('data/user');
        if(!fs.existsSync("data/user/root.json")){
            const perl:LocalPermiision = {
                view: true,
                create: true,
                edit: true,
                delete: true,
            }
            const per:GlobalPermission = {
                project: perl,
                task: perl,
                node: perl,
                parameter: perl,
                lib: perl,
                log: perl,
                execute_job: true
            }
            const root:UserProfile = {
                token: uuidv6(),
                type: UserType.ADMIN,
                preference: {
                    lan: 'en',
                    log: true,
                    font: 18,
                    theme: "dark",
                    notification: false,
                    plugin_token: [],
                },
                name: "root",
                description: "Root User",
                permission: per,
                permission_projects: [],
                permission_tasks: [],
                permission_nodes: [],
            }
            fs.writeFileSync("data/user/root.json", JSON.stringify(root, null, 2))
            console.log(`Login with root using: ${root.token} `)
        }else{
            const root:UserProfile = JSON.parse(fs.readFileSync("data/user/root.json").toString());
            console.log(`Login with root using: ${root.token} `)
        }
        if(!fs.existsSync("server.json")){
            this.setting = {
                open_guest: false
            }
            fs.writeFileSync("server.json", JSON.stringify(this.setting, null, 2))
        }else{
            this.setting = JSON.parse(fs.readFileSync("server.json").toString());
        }
    }

    GetUserType = (token?:string):UserProfileClient => {
        if(!fs.existsSync('data/user')) fs.mkdirSync('data/user');
        if(token != undefined){
            const files = fs.readdirSync('data/user')
            for(let i = 0; i < files.length; i++){
                const p:UserProfile = JSON.parse(fs.readFileSync(path.join("data", "user", files[i])).toString())
                if(p.token == token){
                    return {
                        picture_url: p.picture_url,
                        name: p.name,
                        type: p.type,
                        description: p.description
                    }
                }
            }
        }
        return {
            name: "GUEST",
            type: UserType.GUEST
        }
    }

    ChangeProfile = (token:string | undefined, data:any) => {
        if(token != undefined){
            const files = fs.readdirSync('data/user')
            for(let i = 0; i < files.length; i++){
                const p:UserProfile = JSON.parse(fs.readFileSync(path.join("data", "user", files[i])).toString())
                if(p.token == token){
                    if(data.pic != undefined){
                        p.picture_url = data.pic
                    }
                    if(data.name != undefined){
                        p.name = data.name
                    }
                    if(data.description != undefined){
                        p.description = data.description
                    }
                    fs.writeFileSync(path.join("data", "user", files[i]), JSON.stringify(p, null, 2))
                    console.log("Update")
                    break
                }
            }
        }else{
            console.log("token is null")
        }
    }
    //#endregion
}


export const backendEvent = new BackendEvent()
